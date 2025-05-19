import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, PieChart, BarChart, LineChart, Table2, Check, AlertCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema for dashboard configuration
const dashboardConfigSchema = z.object({
  title: z.string().min(1, { message: 'Dashboard title is required' }),
  description: z.string().optional(),
  charts: z.array(
    z.object({
      type: z.string().min(1, { message: 'Chart type is required' }),
      title: z.string().min(1, { message: 'Chart title is required' }),
      controls: z.array(z.string()).min(1, { message: 'Select at least one control' }),
      position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
    })
  ).optional(),
  showSummaryStats: z.boolean().default(true),
});

const defaultChartConfig = {
  type: 'pie',
  title: '',
  controls: [],
  position: { x: 0, y: 0, w: 6, h: 4 },
};

const chartTypes = [
  { value: 'bar', label: 'Bar Chart', icon: BarChart },
  { value: 'line', label: 'Line Chart', icon: LineChart },
  { value: 'table', label: 'Table', icon: Table2 },
];

export function CatalogDashboardStep({ initialConfig = {}, controls = [], catalogId, onSubmit, isSubmitting, apiError = null }) {
  const [selectedChart, setSelectedChart] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  // Setup form with zod resolver
  const form = useForm({
    resolver: zodResolver(dashboardConfigSchema),
    defaultValues: {
      title: initialConfig.title || `${catalogId} Dashboard`,
      description: initialConfig.description || '',
      charts: initialConfig.charts || [],
      showSummaryStats: initialConfig.showSummaryStats !== false,
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'charts',
  });

  // Update form values when initialConfig changes
  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      form.reset({
        title: initialConfig.title || `${catalogId} Dashboard`,
        description: initialConfig.description || '',
        charts: initialConfig.charts || [],
        showSummaryStats: initialConfig.showSummaryStats !== false,
      });
    }
  }, [initialConfig, catalogId, form]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  const handleAddChart = () => {
    append({ ...defaultChartConfig, title: `Chart ${fields.length + 1}` });
    setSelectedChart(fields.length);
  };

  const handleChartChange = (index, field, value) => {
    const updatedChart = { ...fields[index] };
    updatedChart[field] = value;
    update(index, updatedChart);
  };

  const handleDeleteChart = (index) => {
    remove(index);
    setSelectedChart(null);
  };

  const handleSelectControls = (index, selectedControls) => {
    const updatedChart = { ...fields[index] };
    updatedChart.controls = selectedControls;
    update(index, updatedChart);
  };

  const handleSubmit = (data) => {
    setSubmitError(null);
    onSubmit(data);
  };

  const ChartPreview = ({ type }) => {
    const Icon = chartTypes.find(chart => chart.value === type)?.icon || PieChart;
    return (
      <div className="h-40 flex items-center justify-center rounded-md bg-gray-100 p-6">
        <Icon className="h-20 w-20 text-gray-400" />
      </div>
    );
  };

  return (
    <div className="py-4">
      <h2 className="mb-6 text-left text-xl font-semibold">Configure Dashboard</h2>
      
      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {typeof submitError === 'string' 
              ? submitError 
              : 'There was an error saving your data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dashboard Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dashboard title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div>
              <FormField
                control={form.control}
                name="showSummaryStats"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between border rounded-lg p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Show Summary Statistics</FormLabel>
                      <p className="text-sm text-gray-500">
                        Display summary metrics at the top of the dashboard
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter dashboard description" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">Dashboard Charts</h3>
              <Button 
                type="button" 
                onClick={handleAddChart}
                variant="destructive"
              >
                Add Chart
              </Button>
            </div>

            {fields.length > 0 ? (
              <Tabs 
                value={selectedChart !== null ? selectedChart.toString() : undefined}
                onValueChange={(value) => setSelectedChart(parseInt(value))}
                className="mt-2"
              >
                <TabsList className="mb-4">
                  {fields.map((chart, index) => (
                    <TabsTrigger key={chart.id} value={index.toString()}>
                      {chart.title || `Chart ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {fields.map((chart, index) => (
                  <TabsContent key={chart.id} value={index.toString()} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Configure Chart</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <FormItem>
                            <FormLabel>Chart Title <span className="text-red-500">*</span></FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter chart title" 
                                value={chart.title} 
                                onChange={(e) => handleChartChange(index, 'title', e.target.value)} 
                              />
                            </FormControl>
                          </FormItem>

                          <FormItem>
                            <FormLabel>Chart Type <span className="text-red-500">*</span></FormLabel>
                            <Select
                              value={chart.type}
                              onValueChange={(value) => handleChartChange(index, 'type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select chart type" />
                              </SelectTrigger>
                              <SelectContent>
                                {chartTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    <div className="flex items-center">
                                      <type.icon className="mr-2 h-4 w-4" />
                                      {type.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        </div>

                        <FormItem>
                          <FormLabel>Select Controls <span className="text-red-500">*</span></FormLabel>
                          <div className="max-h-[200px] overflow-y-auto border rounded-md p-3">
                            {controls.length === 0 ? (
                              <p className="text-sm text-gray-500">No controls available</p>
                            ) : (
                              <div className="space-y-2">
                                {controls.map(control => (
                                  <div key={control.id} className="flex items-center">
                                    <input 
                                      type="checkbox" 
                                      id={`control-${control.id}-chart-${index}`} 
                                      className="mr-2"
                                      checked={chart.controls?.includes(control.id)}
                                      onChange={(e) => {
                                        const newControls = e.target.checked
                                          ? [...(chart.controls || []), control.id]
                                          : (chart.controls || []).filter(id => id !== control.id);
                                        handleSelectControls(index, newControls);
                                      }}
                                    />
                                    <label 
                                      htmlFor={`control-${control.id}-chart-${index}`}
                                      className="text-sm"
                                    >
                                      {control.name}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormItem>

                        <div>
                          <FormLabel>Layout Preview</FormLabel>
                          <div className="mt-2">
                            <ChartPreview type={chart.type} />
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="destructive"
                          onClick={() => handleDeleteChart(index)}
                        >
                          Remove Chart
                        </Button>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="border rounded-md bg-gray-50 py-10 text-center">
                <p className="text-gray-500">No charts added yet. Click &quot;Add Chart&quot; to start building your dashboard.</p>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
              variant="outline"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
