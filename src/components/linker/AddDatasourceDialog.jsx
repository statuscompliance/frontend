import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { getAllDatasources, getDatasourceMethods, getDatasourceMethodDetails, fetchDatasourceData } from '@/services/datasources';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cleanDatasourceResponse } from '@/utils/datasourceResponseDTO';

// Schema validation for datasource configuration
const datasourceConfigSchema = z.object({
  datasourceId: z.string().min(1, { message: 'Datasource is required' }),
  methodName: z.string().min(1, { message: 'Method is required' }),
});

export function AddDatasourceDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [datasources, setDatasources] = useState([]);
  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState(null);
  const [options, setOptions] = useState({});
  const [methodDetails, setMethodDetails] = useState(null);
  const [loadingMethodDetails, setLoadingMethodDetails] = useState(false);

  const form = useForm({
    resolver: zodResolver(datasourceConfigSchema),
    defaultValues: {
      datasourceId: '',
      methodName: '',
    },
  });

  const selectedDatasourceId = form.watch('datasourceId');
  const selectedMethodName = form.watch('methodName');

  // Fetch datasources on mount
  useEffect(() => {
    async function fetchDatasources() {
      try {
        setLoading(true);
        const response = await getAllDatasources();
        setDatasources(response.filter(ds => ds.isActive !== false));
      } catch (err) {
        toast.error('Failed to load datasources');
        console.error('Error fetching datasources:', err);
      } finally {
        setLoading(false);
      }
    }
    
    if (open) {
      fetchDatasources();
    }
  }, [open]);

  // Fetch methods when datasource changes
  useEffect(() => {
    async function fetchMethods() {
      if (!selectedDatasourceId) {
        setMethods([]);
        return;
      }

      try {
        setLoadingMethods(true);
        setError(null);
        const response = await getDatasourceMethods(selectedDatasourceId);
        
        // New format (v1.2.3): response.methods is an array of method names
        const methodsList = response.methods || [];
        
        setMethods(methodsList);
        
        // Reset method selection when datasource changes
        form.setValue('methodName', '');
        setPreview(null);
      } catch (err) {
        setError('Failed to load methods for this datasource');
        console.error('Error fetching methods:', err);
        setMethods([]);
      } finally {
        setLoadingMethods(false);
      }
    }

    fetchMethods();
  }, [selectedDatasourceId, form]);

  // Fetch method details when method is selected
  useEffect(() => {
    async function fetchMethodDetails() {
      if (!selectedDatasourceId || !selectedMethodName) {
        setMethodDetails(null);
        setOptions({});
        return;
      }

      try {
        setLoadingMethodDetails(true);
        setError(null);
        const details = await getDatasourceMethodDetails(selectedDatasourceId, selectedMethodName);
        setMethodDetails(details);
        
        // Initialize options from methodInfo structure
        if (details.methodInfo) {
          const initialOptions = {};
          
          // Add required options
          if (details.methodInfo.requiredOptions && Array.isArray(details.methodInfo.requiredOptions)) {
            details.methodInfo.requiredOptions.forEach(optionName => {
              initialOptions[optionName] = '';
            });
          }
          
          // Add optional options
          if (details.methodInfo.optionalOptions && Array.isArray(details.methodInfo.optionalOptions)) {
            details.methodInfo.optionalOptions.forEach(optionName => {
              initialOptions[optionName] = '';
            });
          }
          
          setOptions(initialOptions);
        } else {
          setOptions({});
        }
        
        setPreview(null);
      } catch (err) {
        setError('Failed to load method details');
        console.error('Error fetching method details:', err);
        setMethodDetails(null);
        setOptions({});
      } finally {
        setLoadingMethodDetails(false);
      }
    }

    fetchMethodDetails();
  }, [selectedDatasourceId, selectedMethodName]);

  const handleFetchPreview = async () => {
    if (!selectedDatasourceId || !selectedMethodName) {
      toast.error('Please select a datasource and method first');
      return;
    }

    try {
      setLoadingPreview(true);
      setError(null);
      
      const response = await fetchDatasourceData(selectedDatasourceId, {
        methodName: selectedMethodName,
        params: options,
      });
      
      // Clean the response to remove sensitive/irrelevant information
      const cleanedResponse = cleanDatasourceResponse(response);
      setPreview(cleanedResponse);
    } catch (err) {
      setError('Failed to fetch preview data');
      console.error('Error fetching preview:', err);
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleRemoveOption = (key) => {
    setOptions(prev => {
      const newOptions = { ...prev };
      delete newOptions[key];
      return newOptions;
    });
  };

  const handleAddOption = () => {
    const key = prompt('Enter option key:');
    if (key && key.trim()) {
      const value = prompt('Enter option value:');
      handleOptionChange(key.trim(), value || '');
    }
  };

  const handleSubmit = (data) => {
    const selectedDatasource = datasources.find(ds => ds.id === data.datasourceId);
    
    const datasourceConfig = {
      datasourceId: data.datasourceId,
      datasourceName: selectedDatasource?.name || 'Unknown',
      methodName: data.methodName,
      options: options,
      preview: preview,
    };

    onSuccess(datasourceConfig);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Datasource</DialogTitle>
          <DialogDescription>
            Configure a datasource to fetch data from
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 flex gap-6 overflow-hidden">
              {/* Left Column - Configuration Form */}
              <div className="flex-1 flex flex-col min-w-0">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4">
                    {/* Datasource Selection */}
                    <FormField
                      control={form.control}
                      name="datasourceId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Datasource <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={loading}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a datasource" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {datasources.map((ds) => (
                                <SelectItem key={ds.id} value={ds.id}>
                                  {ds.name} ({ds.definitionId})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Method Selection */}
                    <FormField
                      control={form.control}
                      name="methodName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Method <span className="text-red-500">*</span>
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            value={field.value}
                            disabled={!selectedDatasourceId || loadingMethods}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={
                                  loadingMethods ? 'Loading methods...' : 'Select a method'
                                } />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {methods.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Method Parameters/Options */}
                    {loadingMethodDetails && (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading method details...</span>
                      </div>
                    )}

                    {methodDetails && methodDetails.methodInfo && (
                      <div className="space-y-3">
                        {/* Method Description */}
                        {methodDetails.methodInfo.description && (
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-sm text-muted-foreground">
                              {methodDetails.methodInfo.description}
                            </p>
                          </div>
                        )}

                        {/* Required Options */}
                        {methodDetails.methodInfo.requiredOptions && 
                         methodDetails.methodInfo.requiredOptions.length > 0 && (
                          <div className="space-y-2">
                            <FormLabel>Required Parameters</FormLabel>
                            <div className="space-y-3">
                              {methodDetails.methodInfo.requiredOptions.map((optionName) => (
                                <div key={optionName} className="space-y-1">
                                  <FormLabel className="text-sm">
                                    {optionName}
                                    <span className="text-red-500 ml-1">*</span>
                                  </FormLabel>
                                  <Input
                                    value={options[optionName] || ''}
                                    onChange={(e) => handleOptionChange(optionName, e.target.value)}
                                    placeholder={`Enter ${optionName}`}
                                    className="w-full"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Optional Options */}
                        {methodDetails.methodInfo.optionalOptions && 
                         methodDetails.methodInfo.optionalOptions.length > 0 && (
                          <div className="space-y-2">
                            <FormLabel className="text-muted-foreground">Optional Parameters</FormLabel>
                            <div className="space-y-3">
                              {methodDetails.methodInfo.optionalOptions.map((optionName) => (
                                <div key={optionName} className="space-y-1">
                                  <FormLabel className="text-sm text-muted-foreground">
                                    {optionName}
                                  </FormLabel>
                                  <Input
                                    value={options[optionName] || ''}
                                    onChange={(e) => handleOptionChange(optionName, e.target.value)}
                                    placeholder={`Enter ${optionName} (optional)`}
                                    className="w-full"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Examples */}
                        {methodDetails.methodInfo.examples && 
                         methodDetails.methodInfo.examples.length > 0 && (
                          <div className="space-y-2">
                            <FormLabel className="text-sm">Examples</FormLabel>
                            <div className="space-y-2">
                              {methodDetails.methodInfo.examples.map((example, index) => (
                                <div key={index} className="rounded-md border bg-muted/50 p-3">
                                  {example.description && (
                                    <p className="text-xs font-medium mb-2">{example.description}</p>
                                  )}
                                  <pre className="text-xs text-muted-foreground overflow-x-auto">
                                    {JSON.stringify(example.options, null, 2)}
                                  </pre>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="mt-2 h-7 text-xs"
                                    onClick={() => {
                                      setOptions(prev => ({ ...prev, ...example.options }));
                                      toast.success('Example applied to parameters');
                                    }}
                                  >
                                    Use this example
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* No parameters message */}
                        {(!methodDetails.methodInfo.requiredOptions || methodDetails.methodInfo.requiredOptions.length === 0) &&
                         (!methodDetails.methodInfo.optionalOptions || methodDetails.methodInfo.optionalOptions.length === 0) && (
                          <div className="rounded-md bg-muted p-3">
                            <p className="text-sm text-muted-foreground">
                              This method doesn't require any parameters
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Fetch Preview Button */}
                    {selectedDatasourceId && selectedMethodName && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFetchPreview}
                        disabled={loadingPreview}
                        className="w-full"
                      >
                        {loadingPreview ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Fetching preview...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh Preview
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Right Column - Data Preview */}
              <div className="w-[500px] flex flex-col border-l pl-6">
                <h3 className="text-base font-semibold mb-4">Data Preview</h3>
                {loadingPreview && !preview && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Loading preview...</span>
                    </div>
                  </div>
                )}
                
                {!preview && !loadingPreview && (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <RefreshCw className="mx-auto mb-2 h-8 w-8 opacity-20" />
                      <p className="text-sm">No preview available</p>
                      <p className="text-xs mt-1">Configure datasource and click refresh</p>
                    </div>
                  </div>
                )}

                {preview && (
                  <Card className="flex-1 flex flex-col overflow-hidden">
                    <CardContent className="flex-1 p-4 overflow-hidden">
                      <div className="h-full w-full rounded border bg-muted/30 overflow-auto">
                        <pre className="text-xs p-3 min-w-0">
                          {JSON.stringify(preview, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!preview || loadingPreview}
              >
                Add Datasource
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
