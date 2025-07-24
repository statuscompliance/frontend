import { useState, useEffect, useCallback, useRef } from 'react'; // Import useRef
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
import { getAllNodeRedFlows, getFlowParams } from '@/services/mashups';
import { PlusCircle, X, CalendarIcon, Loader2, AlertCircle, Check, Lock } from 'lucide-react'; // Importar Lock
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { controlSchema } from './schemas'; // Ensure this schema is updated as described above
import { saveDraftCatalogId } from '@/utils/draftStorage';

// Helper function to safely parse dates (from string to Date object)
const parseDate = (dateString) => {
  if (!dateString) return undefined;
  try {
    const date = parseISO(dateString);
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return date;
  } catch {
    return undefined;
  }
};

export function NewControlForm({ catalogId, onClose, onSuccess, initialMashupId, customSubmit = null }) {
  const [loading, setLoading] = useState(false);
  const [availableScopes, setAvailableScopes] = useState([]);
  const [availableMashups, setAvailableMashups] = useState([]);
  const [availableParams, setAvailableParams] = useState({});
  const [loadingParams, setLoadingParams] = useState(false);
  const [selectedParam, setSelectedParam] = useState('');
  const [paramValue, setParamValue] = useState('');

  // Reintroduced states for scopes
  const [selectedScope, setSelectedScope] = useState('');
  const [scopeValue, setScopeValue] = useState('');

  const [confirmingScopes, setConfirmingScopes] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [buttonText, setButtonText] = useState('Save');
  const [countdown, setCountdown] = useState(0); // Nuevo estado para el contador
  const countdownIntervalRef = useRef(null); // Ref para el intervalo

  // Setup form with zod validation
  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      period: 'DAILY',
      startDate: parseDate(new Date().toISOString().split('T')[0]),
      endDate: null, // Changed from undefined to null to ensure controlled component
      mashupId: initialMashupId || '',
      params: {}, // params will now include endpoint
      scopes: {},
      catalogId: catalogId
    }
  });

  const { watch, setValue, getValues, setError, clearErrors } = form;
  const watchMashupId = watch('mashupId');
  const watchParams = watch('params');
  const watchScopes = watch('scopes'); // Now watches the object value of scopes

  // Determine if the mashup field should be visible. It's visible if no initialMashupId is provided.
  const isMashupFieldVisible = !initialMashupId;

  // Helper function to handle date selection properly
  const handleDateSelect = (date, onChange) => {
    onChange(date);
  };

  // Memoize fetchFlowParams to prevent unnecessary re-creations
  const fetchFlowParams = useCallback(async (flowId) => {
    if (!flowId) return;

    setLoadingParams(true);
    try {
      const response = await getFlowParams(flowId);
      const fetchedParams = response.data || {};
      const updatedParams = { ...fetchedParams, threshold: '' };
      setAvailableParams(updatedParams);

      let mashupUrl = null;

      const foundMashup = availableMashups.find(m => m.id === flowId);
      if (foundMashup) {
        mashupUrl = foundMashup.endpoint;
      } else if (initialMashupId && initialMashupId === flowId) {
        console.warn(`Mashup with ID ${flowId} not found in available list for initialMashupId. This might indicate a timing issue or that the mashup list doesn't contain it.`);
      }

      // Logic to update 'params' with 'endpoint'
      if (mashupUrl) {
        const currentParams = getValues('params');
        // Only update 'endpoint' if it's different to prevent unnecessary form state updates
        if (currentParams.endpoint !== mashupUrl) {
          setValue('params', { ...currentParams, endpoint: mashupUrl });
        }
      } else {
        // If no endpoint is found, ensure it's removed from params to avoid sending stale data
        const currentParams = getValues('params');
        if (Object.hasOwn(currentParams, 'endpoint')) {
          const newParams = { ...currentParams };
          delete newParams.endpoint;
          setValue('params', newParams);
        }
      }

    } catch (error) {
      console.error('Error fetching flow parameters:', error);
      toast.error('Failed to fetch flow parameters');
    } finally {
      setLoadingParams(false);
    }
  }, [availableMashups, initialMashupId, setValue, getValues]); // Added getValues to deps

  useEffect(() => {
    const fetchScopes = async () => {
      try {
        const response = await getAllScopes();
        setAvailableScopes(response);
      } catch (error) {
        console.error('Error fetching scopes:', error);
        toast.error('Failed to fetch available scopes');
      }
    };

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
    if (isMashupFieldVisible || initialMashupId) {
      fetchMashups();
    }
  }, [isMashupFieldVisible, initialMashupId]);

  useEffect(() => {
    if (watchMashupId && availableMashups.length > 0) {
      fetchFlowParams(watchMashupId);
    }
  }, [watchMashupId, availableMashups, fetchFlowParams]);

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

  // Reintroduced addScope function
  const addScope = () => {
    if (selectedScope && scopeValue) {
      const updatedScopes = { ...getValues('scopes'), [selectedScope]: scopeValue };
      setValue('scopes', updatedScopes);
      setSelectedScope('');
      setScopeValue('');
    }
  };

  // Reintroduced removeScope function
  const removeScope = (key) => {
    const updatedScopes = { ...getValues('scopes') };
    delete updatedScopes[key];
    setValue('scopes', updatedScopes);
  };

  useEffect(() => {
    if (catalogId) {
      saveDraftCatalogId(catalogId);
    }
  }, [catalogId]);

  const handleFormSubmit = async (data) => {
    const currentScopes = data.scopes; // Get the current scopes object

    // Lógica de confirmación de scopes:
    // Si no hay scopes Y no estamos en fase de confirmación
    if (Object.keys(currentScopes).length === 0 && !confirmingScopes) {
      toast.info('You are about to create a control without scopes. Confirm to proceed.');
      setConfirmingScopes(true); // Entra en fase de confirmación
      setCooldownActive(true);   // Activa el cooldown
      setButtonText('Confirmar');    // Cambia el texto del botón
      setCountdown(2); // Inicia el contador en 2 segundos

      // Limpia cualquier intervalo existente para evitar múltiples intervalos
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      // Inicia el contador
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            setCooldownActive(false);
            setButtonText('Save');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Importante: Detiene la ejecución aquí. El usuario debe volver a hacer clic.
      return;
    }

    // Si llegamos aquí, significa:
    // 1. Hay scopes presentes, O
    // 2. No hay scopes, pero 'confirmingScopes' es TRUE (el usuario está confirmando)
    setLoading(true); // Activa el loading solo cuando se va a realizar la submisión real
    try {
      if (catalogId) {
        saveDraftCatalogId(catalogId);
        data.catalogId = catalogId;
      }

      const dataToSubmit = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
        scopes: currentScopes, // Utiliza el objeto de scopes actual
        // endpoint is now part of data.params, so no need to explicitly pass it here
      };

      let result;
      if (customSubmit) {
        result = await customSubmit(dataToSubmit);
      } else {
        const response = await createControl(dataToSubmit);
        const createdControl = response.data || response;

        if (Object.keys(dataToSubmit.scopes).length > 0) {
          const scopeSetData = {
            controlId: createdControl.id,
            scopes: dataToSubmit.scopes
          };
          await createScopeSet(scopeSetData);
        }

        toast.success('Control creado exitosamente con scopes asociados');
        result = createdControl;
      }
      onSuccess(result); // Llama a onSuccess con el control creado
      onClose(); // Cierra el diálogo al éxito
      // Resetea el estado de confirmación tras una submisión exitosa
      setConfirmingScopes(false);
      setCooldownActive(false);
      setButtonText('Save');
    } catch (error) {
      console.error('Error creando control y scopes:', error);
      if (error.status === 400) {
        const errorMessage = error.message || 'Error de validación en los datos del control';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.msg ||
                               error.response?.data?.message ||
                               'Falló la creación del control y la asociación de scopes';
        toast.error(errorMessage);
      }
      // Resetea el estado de confirmación en caso de error para permitir un nuevo intento
      setConfirmingScopes(false);
      setCooldownActive(false);
      setButtonText('Save');
    } finally {
      setLoading(false); // Asegura que 'loading' siempre se desactive al finalizar la operación
    }
  };

  // Function to format date for display in the calendar field
  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? parseDate(date) : date;
    return dateObj ? format(dateObj, 'PPP') : '';
  };

  // Limpiar el intervalo al desmontar el componente
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);


  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Control</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Control name" {...field} maxLength={40} />
                    </FormControl>
                    <FormMessage />
                    <div className="text-xs text-muted-foreground text-right">
                      {field.value?.length || 0}/40
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Period <span className="text-red-500">*</span></FormLabel>
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
                  <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="Control description" {...field} maxLength={140} rows={3} />
                  </FormControl>
                  <FormMessage />
                  <div className="text-xs text-muted-foreground text-right">
                    {field.value?.length || 0}/140
                  </div>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            type="button"
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
                          selected={field.value}
                          onSelect={(date) => handleDateSelect(date, field.onChange)}
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
                    <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                            type="button"
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
                          selected={field.value}
                          onSelect={(date) => handleDateSelect(date, field.onChange)}
                          disabled={(date) =>
                            form.getValues('startDate') && date < form.getValues('startDate')
                          }
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
                    <FormLabel>Mashup <span className="text-red-500">*</span></FormLabel>
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
                            {mashup.label || mashup.name} {mashup.endpoint && `(${mashup.endpoint})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Updated FormField for endpoint to be part of params */}
            <FormField
              control={form.control}
              name="params.endpoint" // Changed name to point to params.endpoint
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mashup Endpoint</FormLabel> {/* Changed label */}
                  <FormControl>
                    <Input placeholder="Endpoint will appear here" {...field} disabled={true} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Parameters <span className="text-red-500">*</span></FormLabel>
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
                      // Exclude 'endpoint' from the selectable parameters, as it's displayed separately
                      paramName !== 'endpoint' && !Object.hasOwn(watchParams, paramName) && (
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
                  // Exclude 'endpoint' from the displayed parameters in this list
                  key !== 'endpoint' && (
                    <div key={key} className="flex items-center rounded-md bg-gray-100">
                      <Badge key={key} variant="outline" className="px-2 py-1">
                        <span>{key}: {value}</span>
                        <div
                          role="button"
                          tabIndex="0"
                          className="ml-1 flex cursor-pointer items-center text-center"
                          onClick={() => removeParam(key)}
                        >
                          <X size="14" />
                        </div>
                      </Badge>
                    </div>
                  )
                ))}
              </div>
              {form.formState.errors.params && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.params.message}</p>
              )}
            </div>

            {/* Scopes field (reverted to previous method) */}
            <div className="space-y-2">
              <FormLabel>Scopes (Opcional)</FormLabel>
              <div className="flex space-x-2">
                <Select
                  value={selectedScope}
                  onValueChange={setSelectedScope}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un scope" />
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
                  placeholder="Valor del scope"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  disabled={!selectedScope}
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
              {form.formState.errors.scopes && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.scopes.message}</p>
              )}
            </div>

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                onClick={() => {
                  setConfirmingScopes(false); // Reset confirmation on cancel
                  setCooldownActive(false);   // Clear cooldown on cancel
                  setButtonText('Save');      // Reset button text on cancel
                  onClose();
                }}
                variant="outline"
                type="button"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white"
                disabled={loading || cooldownActive}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : cooldownActive ? (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    {buttonText} ({countdown}s)
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-4 w-4"/>
                    {buttonText}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
