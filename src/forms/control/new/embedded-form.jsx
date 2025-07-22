import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { createControl } from '@/services/controls';
import { getAllScopes, createScopeSet } from '@/services/scopes';
import { getAllNodeRedFlows, getFlowParams } from '@/services/mashups';
import { PlusCircle, X, CalendarIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { controlSchema } from './schemas';

export function EmbeddedControlForm({ catalogId, onClose, onSuccess, initialMashupId, mashup }) {
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
      name: `control-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      description: `Auto-generated control for testing mashup: ${mashup?.name || 'Unknown mashup'}`,
      period: 'DAILY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      mashupId: initialMashupId || '', 
      params: {
        backendUrl: `${import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1'}/computations/bulk`
      },
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
        const response = await getAllNodeRedFlows();
        setAvailableMashups(response.data);
      } catch (error) {
        console.error('Error fetching mashups:', error);
        toast.error('Failed to fetch available mashups');
      }
    };

    fetchScopes();
    fetchMashups();
  }, []);

  // Determine if the mashup field should be visible. It's visible if no initialMashupId is provided.
  const isMashupFieldVisible = !initialMashupId;

  // When availableMashups loads and initialMashupId is provided, find and set the mashup URL in params
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';
    const backendUrl = `${baseUrl}/computations/bulk`;
    
    if (mashup && mashup.endpoint) {
      // Use the endpoint from the provided mashup object
      const existingParams = getValues('params');
      const updatedParams = { 
        ...existingParams, 
        endpoint: mashup.endpoint,
        backendUrl: backendUrl
      };
      setValue('params', updatedParams);
    } else if (availableMashups.length > 0 && initialMashupId) {
      const selectedMashup = availableMashups.find(mashup => mashup.id === initialMashupId);
      if (selectedMashup && selectedMashup.endpoint) {
        const existingParams = getValues('params');
        const updatedParams = { 
          ...existingParams, 
          endpoint: selectedMashup.endpoint,
          backendUrl: backendUrl
        };
        setValue('params', updatedParams);
      } else {
        console.warn(`Mashup with ID ${initialMashupId} not found in available list. This might indicate a timing issue or that the mashup list doesn't contain it.`);
      }
    }
  }, [availableMashups, getValues, initialMashupId, setValue, mashup]);

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
      
      // Find the selected mashup endpoint and add it as "endpoint" parameter
      const selectedMashup = availableMashups.find(mashup => mashup.id === flowId);
      const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';
      const backendUrl = `${baseUrl}/computations/bulk`;
      
      if (selectedMashup && selectedMashup.endpoint) {
        const updatedFormParams = { 
          ...getValues('params'), 
          endpoint: selectedMashup.endpoint,
          backendUrl: backendUrl
        };
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
    // Prevent removal of hidden/system parameters
    if (key === 'backendUrl' || key === 'endpoint') {
      console.warn('Cannot remove system parameter:', key);
      return;
    }
    
    const updatedParams = { ...getValues('params') };
    delete updatedParams[key];
    setValue('params', updatedParams);
  };

  // In the useEffect that handles initial mashup loading:
  useEffect(() => {
    // Load mashups always if there's an initialMashupId, or if the field is visible for user selection.
    if (isMashupFieldVisible || initialMashupId) { 
      // Logic for loading mashups is already in the earlier useEffect.
    }
  }, [isMashupFieldVisible, initialMashupId]);

  const onSubmit = async (data) => {
    setLoading(true);

    try {
      // 'data.params' should now correctly contain the 'endpoint' if applicable
      const createdControl = await createControl(data);
      
      // Then create the scope set using the control ID if scopes exist
      if (Object.keys(data.scopes).length > 0) {
        const scopeSetData = {
          controlId: createdControl.id,
          scopes: data.scopes
        };
        
        await createScopeSet(scopeSetData);
      }
      
      onSuccess(createdControl.id, data.mashupId);
    } catch (error) {
      console.error('Error creating control and scopes:', error);
      const errorMessage = error.response?.data.error || 'Failed to create control and associate scopes';
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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

        {isMashupFieldVisible && (
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
        )}

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
                  // Avoid including already added parameters and exclude hidden parameters
                  !Object.hasOwn(watchParams, paramName) && paramName !== 'backendUrl' && (
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
            {Object.entries(watchParams)
              .filter(([key]) => key !== 'backendUrl') // Filter out hidden parameters
              .map(([key, value]) => (
                <div key={key} className="flex items-center rounded-md bg-gray-100">
                  <Badge key={key} variant="outline" className="px-2 py-1">
                    <span>{key}: {value}</span>
                    {key !== 'endpoint' && (
                      <div 
                        role="button"
                        tabIndex="0"
                        className="ml-1 flex cursor-pointer items-center text-center"
                        onClick={() => removeParam(key)}
                      >
                        <X size="14" />
                      </div>
                    )}
                  </Badge>
                </div>
              ))}
          </div>
          {form.formState.errors.params && (
            <p className="text-sm text-destructive font-medium">{form.formState.errors.params.message}</p>
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
              <div key={key} className="flex items-center rounded-md bg-gray-100">
                <Badge key={key} variant="outline" className="px-2 py-1">
                  <span>{key}: {value}</span>
                  <div 
                    role="button"
                    tabIndex="0"
                    className="ml-1 flex cursor-pointer items-center text-center"
                    onClick={() => removeScope(key)}
                  >
                    <X size="14" />
                  </div>
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
