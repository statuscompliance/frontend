import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createControl } from '@/services/controls';
import { getAllScopes, createScopeSet } from '@/services/scopes';
import { getAllApiFlows, getFlowParams } from '@/services/mashups';
import { PlusCircle, X, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { controlSchema } from './schemas';

export function NewControlForm({ catalogId, onClose, onSuccess, customSubmit = null }) {
  const [loading, setLoading] = useState(false);
  const [availableScopes, setAvailableScopes] = useState([]);
  const [availableMashups, setAvailableMashups] = useState([]);
  const [availableParams, setAvailableParams] = useState({});
  const [loadingParams, setLoadingParams] = useState(false);
  const [selectedScope, setSelectedScope] = useState('');
  const [scopeValue, setScopeValue] = useState('');
  const [selectedParam, setSelectedParam] = useState('');
  const [paramValue, setParamValue] = useState('');

  // Setup form with zod validation
  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      period: 'DAILY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      mashupId: '',
      params: {},
      scopes: {},
      catalogId: catalogId
    }
  });

  const { watch, setValue, getValues } = form;
  const watchMashupId = watch('mashupId');
  const watchParams = watch('params');
  const watchScopes = watch('scopes');

  useEffect(() => {
    // Fetch available scopes for the dropdown
    const fetchScopes = async () => {
      try {
        const response = await getAllScopes();
        setAvailableScopes(response);
      } catch (error) {
        console.error('Error fetching scopes:', error);
        toast.error('Failed to fetch available scopes');
      }
    };

    // Fetch available mashups for the dropdown
    const fetchMashups = async () => {
      try {
        const response = await getAllApiFlows();
        setAvailableMashups(response.data);
      } catch (error) {
        console.error('Error fetching mashups:', error);
        toast.error('Failed to fetch available mashups');
      }
    };

    fetchScopes();
    fetchMashups();
  }, []);

  // When mashupId changes, fetch the params
  useEffect(() => {
    if (watchMashupId) {
      fetchFlowParams(watchMashupId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchMashupId]);

  const fetchFlowParams = async (flowId) => {
    if (!flowId) return;
    
    setLoadingParams(true);
    try {
      const response = await getFlowParams(flowId);
      const fetchedParams = response.data || {};
      const updatedParams = { ...fetchedParams, threshold: '' }; // Add threshold param
      setAvailableParams(updatedParams);
      
      const selectedMashup = availableMashups.find(mashup => mashup.id === flowId);
      if (selectedMashup && selectedMashup.url) {
        const updatedFormParams = { ...getValues('params'), endpoint: selectedMashup.url };
        setValue('params', updatedFormParams);
      }
    } catch (error) {
      console.error('Error fetching flow parameters:', error);
      toast.error('Failed to fetch flow parameters');
    } finally {
      setLoadingParams(false);
    }
  };

  const addScope = () => {
    if (selectedScope && scopeValue) {
      const updatedScopes = { ...getValues('scopes'), [selectedScope]: scopeValue };
      setValue('scopes', updatedScopes);
      setSelectedScope('');
      setScopeValue('');
    }
  };

  const removeScope = (key) => {
    const updatedScopes = { ...getValues('scopes') };
    delete updatedScopes[key];
    setValue('scopes', updatedScopes);
  };

  const addParam = () => {
    if (selectedParam && paramValue) {
      const updatedParams = { ...getValues('params'), [selectedParam]: paramValue };
      setValue('params', updatedParams);
      setSelectedParam('');
      setParamValue('');
    }
  };

  const removeParam = (key) => {
    const updatedParams = { ...getValues('params') };
    delete updatedParams[key];
    setValue('params', updatedParams);
  };

  const onSubmit = async (data) => {
    setLoading(true);
  
    try {
      // If customSubmit is provided, use it instead of the default submit behavior
      if (customSubmit) {
        const result = await customSubmit(data);
        onSuccess(result);
      } else {
        // Default behavior: create control and scope set
        const response = await createControl(data);
        const createdControl = response.data || response;
        
        // Then create the scope set using the control ID if scopes exist
        if (Object.keys(data.scopes).length > 0) {
          const scopeSetData = {
            controlId: createdControl.id,
            scopes: data.scopes
          };
          
          await createScopeSet(scopeSetData);
        }
        
        toast.success('Control created successfully with associated scopes');
        onSuccess(createdControl);
      }
    } catch (error) {
      console.error('Error creating control and scopes:', error);
      const errorMessage = error.response?.data || 'Failed to create control and associate scopes';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to format date for display in the calendar field
  const formatDate = (date) => {
    if (!date) return '';
    if (typeof date === 'string') {
      return format(new Date(date), 'PPP');
    }
    return format(date, 'PPP');
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Control</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Control name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period*</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                        <SelectItem value="YEARLY">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Control description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date*</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date.toISOString().split('T')[0]);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="endDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            {field.value ? (
                              formatDate(field.value)
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date.toISOString().split('T')[0]);
                            } else {
                              field.onChange(null);
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="mashupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mashup*</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select mashup" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {availableMashups.map((mashup) => (
                        <SelectItem className="hover:cursor-pointer" key={mashup.id} value={mashup.id}>
                          {mashup.label || mashup.name} {mashup.url && `(${mashup.url})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Parameters*</FormLabel>
              <div className="flex space-x-2">
                <Select 
                  value={selectedParam}
                  onValueChange={setSelectedParam}
                  disabled={!watchMashupId || loadingParams || Object.keys(availableParams).length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingParams ? 'Loading parameters...' : 'Select parameter'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {Object.keys(availableParams).map((paramName) => (
                      // Avoid including already added parameters
                      !Object.hasOwn(watchParams, paramName) && (
                        <SelectItem className="hover:cursor-pointer" key={paramName} value={paramName}>
                          {paramName}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Parameter value"
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                  disabled={!selectedParam}
                />
                <div className="flex items-center">
                  <div
                    onClick={addParam}
                    className={`p-1 transition-all ${selectedParam && paramValue ? 'cursor-pointer hover:bg-secondary hover:rounded-full' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <PlusCircle size="22" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(watchParams).map(([key, value]) => (
                  <div key={key} className="flex items-center bg-gray-100 rounded-md">
                    <Badge key={key} variant="outline" className="px-2 py-1">
                      <span>{key}: {value}</span>
                      <div 
                        role="button"
                        tabIndex="0"
                        className="flex cursor-pointer ml-1 text-center items-center"
                        onClick={() => removeParam(key)}
                      >
                        <X size="14" />
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
              {form.formState.errors.params && (
                <p className="text-sm font-medium text-destructive">{form.formState.errors.params.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <FormLabel>Scopes (Optional)</FormLabel>
              <div className="flex space-x-2">
                <Select 
                  value={selectedScope} 
                  onValueChange={setSelectedScope}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select scope" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableScopes.map((scope) => (
                      <SelectItem className="hover:cursor-pointer" key={scope.id} value={scope.name}>
                        {scope.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Scope value"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                />
                <div className="flex items-center">
                  <div
                    onClick={addScope}
                    className={`p-1 transition-all ${selectedScope && scopeValue ? 'cursor-pointer hover:bg-secondary hover:rounded-full' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <PlusCircle size="22" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(watchScopes).map(([key, value]) => (
                  <div key={key} className="flex items-center bg-gray-100 rounded-md">
                    <Badge key={key} variant="outline" className="px-2 py-1">
                      <span>{key}: {value}</span>
                      <div 
                        role="button"
                        tabIndex="0"
                        className="flex cursor-pointer ml-1 text-center items-center"
                        onClick={() => removeScope(key)}
                      >
                        <X size="14" />
                      </div>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                type="button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                variant="destructive"
              >
                {loading ? 'Creating...' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
