import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { dashboardsService } from '@/services/grafana/dashboards';
import { queriesService } from '@/services/grafana/queries';
import { getAllControls } from '@/services/controls';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PlusCircle, Trash, ChevronDown, ChevronRight, LineChart, GaugeCircle, Table2, Activity, BarChart4, Globe, TrendingUp } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { panelSchema } from './schemas';
import { addPanelToControl } from '@/services/controls';
import { PanelPreview } from '@/components/dashboard/panel-preview';
// import { Tabs, TabsContent, TabsList, TabsTrigger s} from '@/components/ui/tabs';

// Available panel types with icons or descriptions
const panelTypes = [
  { value: 'timeseries', label: 'Time Series', icon: LineChart },
  { value: 'gauge', label: 'Gauge', icon: GaugeCircle },
  { value: 'table', label: 'Table', icon: Table2 },
  { value: 'stat', label: 'Stat', icon: Activity },
  { value: 'bar', label: 'Bar Chart', icon: BarChart4 },
  { value: 'geomap', label: 'Map', icon: Globe },
  { value: 'graph', label: 'Graph', icon: TrendingUp },
];

// Available operators for WHERE conditions
const whereOperators = ['=', '>', '<', '>=', '<=', '<>', 'LIKE', 'IN', 'NOT IN'];

const tableAttributes = {
  'Point': ['id', 'agreementId', 'guaranteeId', 'guaranteeValue', 'guaranteeResult', 'timestamp', 'metrics', 'scope', 'computationGroup', 'createdAt', 'updatedAt']
};

export function AddPanelForm({ dashboardUid, onClose, onSuccess, dashboardTimeRange }) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [rawSql, setRawSql] = useState('');
  const [controls, setControls] = useState([]);
  const [loadingControls, setLoadingControls] = useState(false);
  const [showTempDashboardPreview, setShowTempDashboardPreview] = useState(false);
  const [panelConfigForPreview, setPanelConfigForPreview] = useState(null);
  // Nuevos estados para controlar la expansión de las secciones
  const [fieldsExpanded, setFieldsExpanded] = useState(false);
  const [conditionsExpanded, setConditionsExpanded] = useState(false);

  // Setup form with zod validation
  const form = useForm({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      title: '',
      type: 'graph',
      description: '',
      table: 'Point',
      sqlQuery: {
        model: 'Point',
        operation: 'findAll',
        options: {
          attributes: ['id', 'agreementId', 'guaranteeId', 'guaranteeValue', 'guaranteeResult', 'timestamp', 'metrics', 'scope', 'computationGroup'],
        }
      },
      showLegend: true,
      unit: '',
      decimals: 2,
      min: undefined,
      max: undefined,
      thresholds: [],
      controlId: ''
    }
  });

  const { watch, setValue, getValues } = form;
  const watchType = watch('type');
  const watchTable = watch('table');
  const watchSqlQuery = watch('sqlQuery');

  // Load available controls when the form opens
  useEffect(() => {
    const fetchControls = async () => {
      setLoadingControls(true);
      try {
        const response = await getAllControls();
        const controlsData = Array.isArray(response) ? response : (response.data || []);
        setControls(controlsData);
      } catch (error) {
        console.error('Error fetching controls:', error);
        toast.error('Failed to load controls');
      } finally {
        setLoadingControls(false);
      }
    };

    fetchControls();
  }, []);
  
  // When table changes, update the sqlQuery model as well
  useEffect(() => {
    // Map table name to model name (removes trailing 's')
    const modelName = watchTable.endsWith('s') ? watchTable.slice(0, -1) : watchTable;
    setValue('sqlQuery.model', modelName);
  }, [watchTable, setValue]);

  // Generate SQL preview when query changes
  useEffect(() => {
    generateSqlPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSqlQuery]);

  const generateSqlPreview = async () => {
    try {
      const queryData = getValues('sqlQuery');
      if (!queryData.options.attributes || queryData.options.attributes.length === 0) return;
      
      setPreviewLoading(true);
      const response = await queriesService.buildSql(queryData);
      
      // Asegúrate de que rawSql sea una cadena de texto
      let sqlText = '';
      if (typeof response === 'object') {
        if (response) {
          sqlText = typeof response.query === 'string' 
            ? response.query 
            : JSON.stringify(response.query, null, 2);
        } else {
          sqlText = JSON.stringify(response.query, null, 2);
        }
      } else {
        sqlText = String(response.query);
      }
      
      setRawSql(sqlText);
    } catch (error) {
      console.error('Error generating SQL preview:', error);
      setRawSql('Error generating SQL');
    } finally {
      setPreviewLoading(false);
    }
  };

  const generateTempDashboardPreview = async () => {
    try {
      if (!rawSql) await generateSqlPreview();
      
      setPreviewLoading(true);
      const panelData = getValues();
      
      // Create complete configuration for temporary dashboard preview
      const previewConfig = {
        title: panelData.title || 'Panel Preview',
        type: panelData.type,
        description: panelData.description || '',
        sql: rawSql || '',
        table: panelData.table,
        controlId: panelData.controlId === 'none' ? '' : panelData.controlId,
        dataSource: {
          type: 'grafana-postgresql-datasource',
          uid: 'P5E4ECD82955BB660'
        },
        sqlQuery: {
          ...panelData.sqlQuery,
          rawSql: rawSql
        },
        whereConditions: panelData.sqlQuery?.whereConditions || [],
        selectedFields: panelData.sqlQuery?.selectedFields || [],
        options: {
          showLegend: panelData.showLegend,
          unit: panelData.unit || '',
          decimals: panelData.decimals,
          min: panelData.min,
          max: panelData.max,
          thresholds: panelData.thresholds || []
        },
        dimensions: {
          x: 0, 
          y: 0,
          w: 12,
          h: 8
        },
        targets: [
          {
            rawSql: rawSql,
            format: 'table'
          }
        ],
        time: dashboardTimeRange || { from: 'now-7d', to: 'now' }
      };
      
      // Set configuration for dashboard preview component
      setPanelConfigForPreview(previewConfig);
      setShowTempDashboardPreview(true);
      
      toast.success('Creating temporary dashboard for preview...');
    } catch (error) {
      console.error('Error generating temp dashboard preview:', error);
      toast.error('Failed to generate panel preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Add a field to select
  const addField = () => {
    const currentFields = getValues('sqlQuery.options.attributes') || [];
    
    const availableFields = tableAttributes[watchTable].filter(field => 
      !currentFields.includes(field) && field !== 'createdAt' && field !== 'updatedAt'
    );
    if (availableFields.length > 0) {
      setValue('sqlQuery.options.attributes', [...currentFields, availableFields[0]]);
    } else {
      toast.info('Todos los campos ya han sido seleccionados');
    }
  };

  // Remove a field at the specified index
  const removeField = (index) => {
    const currentFields = getValues('sqlQuery.options.attributes') || [];
    if (currentFields.length <= 1) {
      toast.error('Al menos un campo debe estar seleccionado');
      return;
    }
    setValue('sqlQuery.options.attributes', currentFields.filter((_, i) => i !== index));
  };

  // Add a WHERE condition
  const addWhereCondition = () => {
    const currentConditions = getValues('sqlQuery.options.where') || [];
    setValue('sqlQuery.options.where', [
      ...currentConditions, 
      { key: tableAttributes[watchTable][0], operator: '=', value: '' }
    ]);
  };

  // Remove a WHERE condition at the specified index
  const removeWhereCondition = (index) => {
    const currentConditions = getValues('sqlQuery.options.where') || [];
    setValue('sqlQuery.options.where', currentConditions.filter((_, i) => i !== index));
  };

  // Submit the form to create a new panel
  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // Add the raw SQL to the panel data
      const panelData = { 
        ...data,
        controlId: data.controlId === 'none' ? '' : data.controlId, // Convertir "none" a string vacío
        rawSql: typeof rawSql === 'string' ? rawSql : JSON.stringify(rawSql)
      };
      
      // Send the panel data to the API
      const response = await dashboardsService.addPanel(dashboardUid, panelData);
      const createdPanel = response.data || response;
      
      // If a control was selected, associate the panel with it
      if (data.controlId && data.controlId !== 'none') { // Verificar que no sea "none"
        try {
          // We need the new panel's ID returned from the server
          const panelId = createdPanel.id || createdPanel.panelId;
          if (panelId) {
            await addPanelToControl(data.controlId, panelId.toString(), { dashboardUid });
            toast.success('Panel added and associated with control');
          } else {
            toast.warning('Panel created but could not be associated with control (no panel ID returned)');
          }
        } catch (controlError) {
          console.error('Error associating panel with control:', controlError);
          toast.error('Panel created but association with control failed');
        }
      } else {
        toast.success('Panel added successfully');
      }
      
      onSuccess(createdPanel);
    } catch (error) {
      console.error('Error creating panel:', error);
      toast.error('Failed to create panel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose} className="max-w-5xl w-full">
      <DialogContent className="max-h-[90vh] max-w-5xl w-full overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Panel to Dashboard</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panel Title*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter panel title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Panel Type*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select panel type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {panelTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center">
                              <type.icon className="mr-2 h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <FormField
                control={form.control}
                name="controlId"
                render={({ field }) => (
                  <FormItem className="min-w-[200px] flex-1">
                    <FormLabel>Associate with Control (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingControls ? 'Loading controls...' : 'Select a control'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        <SelectItem value="none">None</SelectItem>
                        {controls.map((control) => (
                          <SelectItem key={control.id} value={control.id}>
                            {control.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Panel description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Selected Fields Section - ahora con toggle */}
                      <div className="space-y-2">
                        <div 
                          className="flex cursor-pointer items-center justify-between" 
                          onClick={() => setFieldsExpanded(!fieldsExpanded)}
                        >
                          <div className="flex items-center space-x-2">
                            {fieldsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <FormLabel className="cursor-pointer">Selected Fields</FormLabel>
                          </div>
                          {fieldsExpanded && (
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addField();
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <PlusCircle className="mr-1 h-4 w-4" /> Add
                            </Button>
                          )}
                        </div>

                        {fieldsExpanded && watchSqlQuery.options?.attributes?.length > 0 ? (
                          <div className="space-y-2">
                            {watchSqlQuery.options.attributes.map((field, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Select
                                  value={field}
                                  onValueChange={(value) => {
                                    const updatedFields = [...getValues('sqlQuery.options.attributes')];
                                    updatedFields[index] = value;
                                    setValue('sqlQuery.options.attributes', updatedFields);
                                  }}
                                >
                                  <SelectTrigger className="flex-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tableAttributes[watchTable]?.map((attr) => (
                                      <SelectItem key={attr} value={attr}>
                                        {attr}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeField(index)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : fieldsExpanded ? (
                          <div className="text-sm text-muted-foreground">
                            No fields selected. Please add at least one field.
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {watchSqlQuery.options?.attributes?.length || 0} field(s) selected. Click to expand.
                          </div>
                        )}
                      </div>

                      {/* Conditions Section */}
                      <div className="space-y-2">
                        <div 
                          className="flex cursor-pointer items-center justify-between" 
                          onClick={() => setConditionsExpanded(!conditionsExpanded)}
                        >
                          <div className="flex items-center space-x-2">
                            {conditionsExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <FormLabel className="cursor-pointer">Conditions</FormLabel>
                          </div>
                          {conditionsExpanded && (
                            <Button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                addWhereCondition();
                              }}
                              variant="outline"
                              size="sm"
                            >
                              <PlusCircle className="mr-1 h-4 w-4" /> Add
                            </Button>
                          )}
                        </div>

                        {conditionsExpanded && watchSqlQuery.options?.where?.length > 0 ? (
                          <>
                            <div className="mb-2 flex items-center space-x-2">
                              <FormLabel className="text-sm">Logic:</FormLabel>
                              <Select
                                value={watchSqlQuery.options.whereLogic || 'AND'}
                                onValueChange={(value) => setValue('sqlQuery.options.whereLogic', value)}
                              >
                                <SelectTrigger className="w-[100px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">AND</SelectItem>
                                  <SelectItem value="OR">OR</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            {watchSqlQuery.options.where.map((condition, index) => (
                              <div key={index} className="flex flex-wrap items-center space-x-2">
                                <Select
                                  value={condition.key}
                                  onValueChange={(value) => {
                                    const updatedConditions = [...getValues('sqlQuery.options.where')];
                                    updatedConditions[index].key = value;
                                    setValue('sqlQuery.options.where', updatedConditions);
                                  }}
                                >
                                  <SelectTrigger className="w-[110px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {tableAttributes[watchTable]?.map((attr) => (
                                      <SelectItem key={attr} value={attr}>
                                        {attr}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
        
                                <Select
                                  value={condition.operator}
                                  onValueChange={(value) => {
                                    const updatedConditions = [...getValues('sqlQuery.options.where')];
                                    updatedConditions[index].operator = value;
                                    setValue('sqlQuery.options.where', updatedConditions);
                                  }}
                                >
                                  <SelectTrigger className="w-[90px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {whereOperators.map((op) => (
                                      <SelectItem key={op} value={op}>
                                        {op}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Input
                                  className="min-w-[150px] flex-1"
                                  placeholder="Value"
                                  value={condition.value}
                                  onChange={(e) => {
                                    const updatedConditions = [...getValues('sqlQuery.options.where')];
                                    updatedConditions[index].value = e.target.value;
                                    setValue('sqlQuery.options.where', updatedConditions);
                                  }}
                                />
                                
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeWhereCondition(index)}
                                >
                                  <Trash className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </>
                        ) : conditionsExpanded ? (
                          <div className="text-sm text-muted-foreground">
                            No conditions added yet. Add a condition to filter your data.
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {watchSqlQuery.options?.where?.length || 0} condition(s) defined. Click to expand.
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Panel Options Section */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row">
                  {watchType !== 'table' && (
                    <div className="flex-1 space-y-2">
                      <FormLabel>Panel Options</FormLabel>
                      <FormField
                        control={form.control}
                        name="showLegend"
                        render={({ field }) => (
                          <FormItem className="h-[50px] flex flex-row items-center justify-between border rounded-lg px-3">
                            <FormLabel className="pt-1">Show Legend</FormLabel>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., bytes, seconds, percent" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="flex flex-col justify-between gap-2 md:flex-row">
                  <FormField
                    control={form.control}
                    name="decimals"
                    render={({ field }) => (
                      <FormItem className="min-w-[150px]">
                        <FormLabel>Decimal Precision</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {(watchType === 'gauge' || watchType === 'stat') && (
                    <>
                      <FormField
                        control={form.control}
                        name="min"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Min Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="max"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Max Value</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                {...field}
                                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Right Column – Panel preview */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <FormLabel>Preview</FormLabel>
                    <div className="flex space-x-2">
                      <Button 
                        type="button" 
                        onClick={generateTempDashboardPreview}
                        variant="default" 
                        size="sm"
                      >
                        Preview
                      </Button>
                    </div>
                  </div>
                  
                  <Card className="border-primary-800">
                    <CardContent className="p-4">
                      <div className="h-[370px] flex items-center justify-center">
                        {previewLoading ? (
                          <div className="text-center">
                            <Skeleton className="mb-4 h-40 w-full" />
                            <p>Creating temporary dashboard...</p>
                          </div>
                        ) : showTempDashboardPreview && panelConfigForPreview ? (
                          <div className="h-full w-full">
                            <PanelPreview 
                              panelConfig={panelConfigForPreview} 
                              height={330} 
                              baseDashboardUid={dashboardUid}
                              customTimeRange={dashboardTimeRange || { from: 'now-24h', to: 'now' }}
                            />
                          </div>
                        ) : (
                          <div className="p-4 text-center text-muted-foreground">
                            <p className="mb-2">Click &apos;Preview&apos; to see your panel with live data</p>
                            <p className="text-xs">This will create a temporary dashboard in Grafana</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button onClick={onClose} variant="outline" type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Panel'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}