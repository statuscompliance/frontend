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
import { PlusCircle, Trash } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { panelSchema } from './schemas';
import { addPanelToControl } from '@/services/controls';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';

// Available panel types with icons or descriptions
const panelTypes = [
  { value: 'graph', label: 'Line Graph' },
  { value: 'gauge', label: 'Gauge' },
  { value: 'table', label: 'Table' },
  { value: 'stat', label: 'Stat' },
  { value: 'timeseries', label: 'Time Series' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'pie', label: 'Pie Chart' },
];

// Available aggregation functions
const aggregationFunctions = ['COUNT', 'SUM', 'AVG', 'MIN', 'MAX'];

// Available operators for WHERE conditions
const whereOperators = ['=', '>', '<', '>=', '<=', '<>', 'LIKE', 'IN', 'NOT IN'];

// Hidden but still used by the form internally
const tableAttributes = {
  'Computations': ['id', 'name', 'status', 'created_at', 'updated_at', 'value'],
  'Configurations': ['id', 'name', 'type', 'value', 'created_at'],
  'Results': ['id', 'computation_id', 'value', 'status', 'created_at'],
  'Metrics': ['id', 'name', 'value', 'timestamp']
};

export function AddPanelForm({ dashboardUid, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewPanel, setPreviewPanel] = useState(null);
  const [rawSql, setRawSql] = useState('');
  const [controls, setControls] = useState([]);
  const [loadingControls, setLoadingControls] = useState(false);

  // Setup form with zod validation
  const form = useForm({
    resolver: zodResolver(panelSchema),
    defaultValues: {
      title: '',
      type: 'graph',
      description: '',
      table: 'Computations', // Hidden from UI but kept for query building
      sqlQuery: {
        aggregations: [{ func: 'COUNT', attr: 'id' }],
        whereConditions: [],
        whereLogic: 'AND',
        table: 'Computations'
      },
      showLegend: true,
      unit: '',
      decimals: 2,
      min: undefined,
      max: undefined,
      thresholds: [],
      controlId: '' // New field for control association
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
  
  // When table changes, update the sqlQuery table as well
  useEffect(() => {
    setValue('sqlQuery.table', watchTable);
  }, [watchTable, setValue]);

  // Generate SQL preview when query changes
  useEffect(() => {
    generateSqlPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchSqlQuery]);

  const generateSqlPreview = async () => {
    try {
      const queryData = getValues('sqlQuery');
      if (queryData.aggregations.length === 0) return;
      
      setPreviewLoading(true);
      const response = await queriesService.buildSql(queryData);
      
      // Asegúrate de que rawSql sea una cadena de texto
      let sqlText = '';
      if (typeof response === 'object') {
        if (response.data) {
          sqlText = typeof response.data === 'string' 
            ? response.data 
            : JSON.stringify(response.data, null, 2);
        } else {
          sqlText = JSON.stringify(response, null, 2);
        }
      } else {
        sqlText = String(response);
      }
      
      setRawSql(sqlText);
    } catch (error) {
      console.error('Error generating SQL preview:', error);
      setRawSql('Error generating SQL');
    } finally {
      setPreviewLoading(false);
    }
  };

  const generatePanelPreview = async () => {
    try {
      if (!rawSql) await generateSqlPreview();
      
      setPreviewLoading(true);
      // Create a temporary panel object for preview
      const panelData = getValues();
      
      // For the preview, we need to create a panel-like object
      const previewPanelData = {
        id: 999, // Temporary ID
        type: panelData.type,
        title: panelData.title || 'Panel Preview',
        description: panelData.description || '',
        options: {
          showLegend: panelData.showLegend,
          unit: panelData.unit || '',
          decimals: panelData.decimals,
          min: panelData.min,
          max: panelData.max,
          thresholds: panelData.thresholds || []
        },
        // Asegúrate de que rawSql sea una cadena
        rawSql: rawSql || ''
      };
      
      setPreviewPanel(previewPanelData);
    } catch (error) {
      console.error('Error generating panel preview:', error);
      toast.error('Failed to generate panel preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Add an aggregation field
  const addAggregation = () => {
    const currentAggregations = getValues('sqlQuery.aggregations') || [];
    setValue('sqlQuery.aggregations', [...currentAggregations, { func: 'COUNT', attr: tableAttributes[watchTable][0] }]);
  };

  // Remove an aggregation at the specified index
  const removeAggregation = (index) => {
    const currentAggregations = getValues('sqlQuery.aggregations') || [];
    if (currentAggregations.length <= 1) {
      toast.error('At least one aggregation is required');
      return;
    }
    setValue('sqlQuery.aggregations', currentAggregations.filter((_, i) => i !== index));
  };

  // Add a WHERE condition
  const addWhereCondition = () => {
    const currentConditions = getValues('sqlQuery.whereConditions') || [];
    setValue('sqlQuery.whereConditions', [
      ...currentConditions, 
      { key: tableAttributes[watchTable][0], operator: '=', value: '' }
    ]);
  };

  // Remove a WHERE condition at the specified index
  const removeWhereCondition = (index) => {
    const currentConditions = getValues('sqlQuery.whereConditions') || [];
    setValue('sqlQuery.whereConditions', currentConditions.filter((_, i) => i !== index));
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
                            {type.label}
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
                      {/* Aggregations Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Aggregations*</FormLabel>
                          <Button
                            type="button"
                            onClick={addAggregation}
                            variant="outline"
                            size="sm"
                          >
                            <PlusCircle className="mr-1 h-4 w-4" /> Add
                          </Button>
                        </div>
                        {watchSqlQuery.aggregations?.map((agg, index) => (
                          <div key={index} className="flex flex-wrap items-center space-x-2">
                            <Select
                              value={agg.func}
                              onValueChange={(value) => {
                                const updatedAggs = [...getValues('sqlQuery.aggregations')];
                                updatedAggs[index].func = value;
                                setValue('sqlQuery.aggregations', updatedAggs);
                              }}
                            >
                              <SelectTrigger className="w-[110px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {aggregationFunctions.map((func) => (
                                  <SelectItem key={func} value={func}>
                                    {func}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <span>(</span>
                            <Select
                              value={agg.attr}
                              onValueChange={(value) => {
                                const updatedAggs = [...getValues('sqlQuery.aggregations')];
                                updatedAggs[index].attr = value;
                                setValue('sqlQuery.aggregations', updatedAggs);
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
                            <span>)</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAggregation(index)}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Where Conditions Section */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <FormLabel>Where Conditions</FormLabel>
                          <Button
                            type="button"
                            onClick={addWhereCondition}
                            variant="outline"
                            size="sm"
                          >
                            <PlusCircle className="mr-1 h-4 w-4" /> Add
                          </Button>
                        </div>

                        {watchSqlQuery.whereConditions?.length > 0 ? (
                          <>
                            <div className="mb-2 flex items-center space-x-2">
                              <FormLabel className="text-sm">Logic:</FormLabel>
                              <Select
                                value={watchSqlQuery.whereLogic || 'AND'}
                                onValueChange={(value) => setValue('sqlQuery.whereLogic', value)}
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

                            {watchSqlQuery.whereConditions.map((condition, index) => (
                              <div key={index} className="flex flex-wrap items-center space-x-2">
                                <Select
                                  value={condition.key}
                                  onValueChange={(value) => {
                                    const updatedConditions = [...getValues('sqlQuery.whereConditions')];
                                    updatedConditions[index].key = value;
                                    setValue('sqlQuery.whereConditions', updatedConditions);
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
                                    const updatedConditions = [...getValues('sqlQuery.whereConditions')];
                                    updatedConditions[index].operator = value;
                                    setValue('sqlQuery.whereConditions', updatedConditions);
                                  }}
                                >
                                  <SelectTrigger className="w-[80px]">
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
                                  value={condition.value}
                                  onChange={(e) => {
                                    const updatedConditions = [...getValues('sqlQuery.whereConditions')];
                                    updatedConditions[index].value = e.target.value;
                                    setValue('sqlQuery.whereConditions', updatedConditions);
                                  }}
                                  placeholder="Value"
                                  className="flex-1"
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
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            No conditions added yet. Add a condition to filter your data.
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
                    <Button type="button" onClick={generatePanelPreview} variant="outline" size="sm">
                      Generate Preview
                    </Button>
                  </div>
                  <div className="h-[370px] flex items-center justify-center border rounded-lg bg-muted/20 p-4">
                    {previewLoading ? (
                      <div className="text-center">Loading preview...</div>
                    ) : previewPanel ? (
                      <div className="h-full w-full">
                        <DashboardPanel dashboardUid={dashboardUid} panel={previewPanel} height={500} preview={true} />
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        Click &apos;Generate Preview&apos; to see how your panel will look
                      </div>
                    )}
                  </div>
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