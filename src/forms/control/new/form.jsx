import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, PlusCircle, X, CalendarIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

import { controlSchema } from './schemas';

import { createControl } from '@/services/controls';
import { getAllScopes, createScopeSet } from '@/services/scopes';
import { getAllNodeRedFlows, getFlowParams } from '@/services/mashups';


export function NewControlForm({ catalogId, onClose, onSuccess, mashupIdPreselected }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMashups, setIsLoadingMashups] = useState(true);
  const [availableMashups, setAvailableMashups] = useState([]);
  const [loadingParams, setLoadingParams] = useState(false);
  const [availableParams, setAvailableParams] = useState({});

  const [availableScopes, setAvailableScopes] = useState([]);

  const [selectedScope, setSelectedScope] = useState('');
  const [scopeValue, setScopeValue] = useState('');
  const [selectedParam, setSelectedParam] = useState('');
  const [paramValue, setParamValue] = useState('');


  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      period: 'DAILY',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      mashupId: mashupIdPreselected || '',
      params: {
        endpoint: '/bpi', // <<< AÑADIDO: Valor por defecto para endpoint
      },
      scopes: {},
      catalogId: catalogId,
    },
  });

  const { watch, setValue, getValues, setError } = form;
  const watchMashupId = watch('mashupId');
  const watchParams = watch('params');
  const watchScopes = watch('scopes');


  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingMashups(true);
      try {
        const [mashupsResponse, scopesResponse] = await Promise.all([
          getAllNodeRedFlows(),
          getAllScopes()
        ]);

        setAvailableMashups(mashupsResponse.data.filter(flow => flow.mainInputType === 'http in'));
        setAvailableScopes(scopesResponse);

        if (mashupIdPreselected) {
          form.setValue('mashupId', mashupIdPreselected, { shouldValidate: true });
        }
      } catch (error) {
        toast.error('Error al cargar datos iniciales (mashups/ámbitos).');
        console.error('Error fetching initial data for form:', error);
      } finally {
        setIsLoadingMashups(false);
      }
    };

    fetchInitialData();
  }, [form, mashupIdPreselected]);


  useEffect(() => {
    if (watchMashupId) {
      fetchFlowParams(watchMashupId);
    } else {
      setAvailableParams({});
      // Al cambiar el mashupId, resetea los parámetros dinámicos,
      // pero mantiene el endpoint si ya está definido en defaultValues.
      // Si quieres resetear *todo* params, incluyendo endpoint,
      // deberías hacer setValue('params', { endpoint: '/bpi' });
      setValue('params', { endpoint: getValues('params').endpoint || '/bpi' });
    }
  }, [watchMashupId, setValue, getValues]); // Añadido getValues a las dependencias

  const fetchFlowParams = async (flowId) => {
    if (!flowId) return;

    setLoadingParams(true);
    try {
      const response = await getFlowParams(flowId);
      const fetchedParams = response.data || {};

      const filteredFetchedParams = Object.keys(fetchedParams).reduce((acc, key) => {
        if (key !== 'endpoint') { // Filtra 'endpoint' si viene del backend para no duplicar
          acc[key] = fetchedParams[key];
        }
        return acc;
      }, {});

      const updatedParamsDefinition = {
        ...filteredFetchedParams,
        threshold: filteredFetchedParams.threshold !== undefined ? filteredFetchedParams.threshold : ''
      };
      setAvailableParams(updatedParamsDefinition);

    } catch (error) {
      console.error('Error fetching flow parameters:', error);
      toast.error('Failed to fetch flow parameters');
    } finally {
      setLoadingParams(false);
    }
  };

  const addScope = () => {
    if (selectedScope && scopeValue.trim()) {
      const currentScopes = getValues('scopes');
      const updatedScopes = { ...currentScopes, [selectedScope]: scopeValue.trim() };
      setValue('scopes', updatedScopes, { shouldValidate: true });
      setSelectedScope('');
      setScopeValue('');
    } else {
      toast.warning('Por favor, selecciona un ámbito y proporciona un valor no vacío.');
    }
  };

  const removeScope = (key) => {
    const currentScopes = getValues('scopes');
    const updatedScopes = { ...currentScopes };
    delete updatedScopes[key];
    setValue('scopes', updatedScopes, { shouldValidate: true });
  };

  const addParam = () => {
    if (selectedParam && paramValue.trim()) {
      const currentParams = getValues('params');
      const updatedParams = { ...currentParams, [selectedParam]: paramValue.trim() };
      setValue('params', updatedParams, { shouldValidate: true });
      setSelectedParam('');
      setParamValue('');
    } else {
      toast.warning('Por favor, selecciona un parámetro y proporciona un valor no vacío.');
    }
  };

  const removeParam = (key) => {
    // Evita eliminar el campo 'endpoint' si es un campo fijo
    if (key === 'endpoint') {
      toast.error('No se puede eliminar el parámetro "endpoint".');
      return;
    }
    const currentParams = getValues('params');
    const updatedParams = { ...currentParams };
    delete updatedParams[key];
    setValue('params', updatedParams, { shouldValidate: true });
  };


  const isButtonDisabled = isSubmitting;

  useEffect(() => {
    console.log(`--- [NewControlForm] Estado Actual ---`);
    console.log(`isSubmitting: ${isSubmitting}`);
    console.log(`isLoadingMashups: ${isLoadingMashups}`);
    console.log(`loadingParams: ${loadingParams}`);
    console.log(`form.formState.isValid: ${form.formState.isValid}`);
    console.log(`isButtonDisabled (calculado): ${isButtonDisabled}`);
    console.log(`Datos del formulario (watch):`, form.watch());
    console.log(`Errores de validación (form.formState.errors):`, form.formState.errors);
    console.log(`-----------------------------------`);
  }, [isSubmitting, isLoadingMashups, loadingParams, isButtonDisabled, form.formState.isValid, form.formState.errors, form]);


  const onSubmit = useCallback(async (data) => {
    console.log('1. Iniciando onSubmit en NewControlForm...');
    setIsSubmitting(true);

    if (!data.mashupId) {
      console.log('2. Validación manual: mashupId ausente.');
      setError('mashupId', { type: 'manual', message: 'El Mashup es requerido.' });
      setIsSubmitting(false);
      return;
    }

    const formattedData = {
      ...data,
      // catalogId ya se preprocesa a número en el esquema Zod
    };

    console.log('3. Datos del formulario formateados para API:', formattedData);

    try {
      console.log('4. Intentando crear control...');
      const createdControl = await createControl(formattedData);
      console.log('5. Control creado exitosamente:', createdControl);

      if (Object.keys(data.scopes).length > 0) {
        console.log('6. Intentando crear ámbitos...');
        const scopeSetData = {
          controlId: createdControl.id,
          scopes: data.scopes
        };
        await createScopeSet(scopeSetData);
        console.log('7. Ámbitos creados.');
      }

      toast.success('Control guardado exitosamente.');
      console.log('8. Llamando a onSuccess...');
      onSuccess(createdControl.id, createdControl.mashupId);
      console.log('9. onSuccess llamado. Fin del try.');

    } catch (error) {
      console.error('X. Error detectado en el catch:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error desconocido al crear el control.';
      toast.error(`Fallo al crear el control: ${errorMessage}`);
      if (error.response?.data?.errors) {
        Object.entries(error.response.data.errors).forEach(([key, value]) => {
          form.setError(key, { type: 'manual', message: value[0] });
        });
      }
    } finally {
      setIsSubmitting(false);
      console.log('Y. Bloque finally: isSubmitting ahora es false.');
    }
  }, [createControl, createScopeSet, onSuccess, setError, form]);

  const formatDate = (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      console.error("Objeto de fecha inválido pasado a formatDate:", date);
      return '';
    }
    return format(dateObj, 'PPP', { locale: es });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Control</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre*</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del control" {...field} disabled={isButtonDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Descripción */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descripción del control" {...field} disabled={isButtonDisabled} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Periodo */}
            <FormField
              control={form.control}
              name="period"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Periodo*</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={isButtonDisabled}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar periodo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="DAILY">Diario</SelectItem>
                      <SelectItem value="WEEKLY">Semanal</SelectItem>
                      <SelectItem value="MONTHLY">Mensual</SelectItem>
                      <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                      <SelectItem value="YEARLY">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Fecha de Inicio */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha de Inicio*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isButtonDisabled}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Selecciona una fecha</span>
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
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Fecha de Fin (Opcional) */}
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha Fin (Opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isButtonDisabled}
                        >
                          {field.value ? (
                            formatDate(field.value)
                          ) : (
                            <span>Selecciona una fecha</span>
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
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo Mashup ID */}
            <FormField
              control={form.control}
              name="mashupId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mashup*</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingMashups || availableMashups.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        {isLoadingMashups ? (
                          <div className="flex items-center">
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando Mashups...
                          </div>
                        ) : (
                          <SelectValue placeholder="Seleccionar mashup" />
                        )}
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {availableMashups.length > 0 ? (
                        availableMashups.map((mashup) => (
                          <SelectItem key={mashup.id} value={mashup.id}>
                            {mashup.label || mashup.name} {mashup.url && `(${mashup.url})`}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="_NO_MASHUPS_AVAILABLE_" disabled>
                          No hay Mashups disponibles
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Sección de Parámetros */}
            <div className="space-y-2">
              <FormLabel>Parámetros*</FormLabel>

              {/* Campo Endpoint fijo */}
              <FormField
                control={form.control}
                name="params.endpoint" // Acceso directo al campo endpoint dentro de params
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endpoint*</FormLabel>
                    <FormControl>
                      <Input placeholder="/bpi" {...field} disabled={isButtonDisabled} />
                    </FormControl>
                    <FormDescription>Ruta del endpoint del mashup.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parámetros Dinámicos */}
              <div className="flex space-x-2">
                <Select
                  value={selectedParam}
                  onValueChange={setSelectedParam}
                  disabled={loadingParams || Object.keys(availableParams).length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingParams ? 'Cargando parámetros...' : 'Seleccionar parámetro'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {/* Filtra parámetros que ya han sido añadidos O que son el 'endpoint' */}
                    {Object.keys(availableParams)
                      .filter(paramName => !Object.hasOwn(watchParams, paramName) && paramName !== 'endpoint')
                      .map((paramName) => (
                        <SelectItem className="hover:cursor-pointer" key={paramName} value={paramName}>
                          {paramName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Valor del parámetro"
                  value={paramValue}
                  onChange={(e) => setParamValue(e.target.value)}
                  disabled={!selectedParam}
                />
                <div className="flex items-center">
                  <div
                    onClick={addParam}
                    className={`p-1 transition-all ${selectedParam && paramValue.trim() ? 'cursor-pointer hover:bg-secondary hover:rounded-full' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <PlusCircle size="22" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {/* Renderiza los parámetros actuales del formulario, excluyendo 'endpoint' si lo deseas mostrar solo en su campo fijo */}
                {Object.entries(watchParams)
                  .filter(([key]) => key !== 'endpoint') // Filtra 'endpoint' para que no aparezca aquí si ya tiene su propio campo
                  .map(([key, value]) => (
                    <div key={key} className="flex items-center rounded-md bg-gray-100">
                      <Badge variant="outline" className="px-2 py-1">
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
                  ))}
              </div>
              {form.formState.errors.params && (
                <p className="text-sm text-destructive font-medium">{form.formState.errors.params.message}</p>
              )}
            </div>

            {/* Sección de Ámbitos Dinámicos */}
            <div className="space-y-2">
              <FormLabel>Ámbitos (Opcional)</FormLabel>
              <div className="flex space-x-2">
                <Select
                  value={selectedScope}
                  onValueChange={setSelectedScope}
                  disabled={availableScopes.length === 0}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Seleccionar ámbito" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-y-auto">
                    {availableScopes.filter(scope => !Object.hasOwn(watchScopes, scope.name)).map((scope) => (
                      <SelectItem className="hover:cursor-pointer" key={scope.id} value={scope.name}>
                        {scope.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Valor del ámbito"
                  value={scopeValue}
                  onChange={(e) => setScopeValue(e.target.value)}
                  disabled={!selectedScope}
                />
                <div className="flex items-center">
                  <div
                    onClick={addScope}
                    className={`p-1 transition-all ${selectedScope && scopeValue.trim() ? 'cursor-pointer hover:bg-secondary hover:rounded-full' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    <PlusCircle size="22" />
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {Object.entries(watchScopes).map(([key, value]) => (
                  <div key={key} className="flex items-center rounded-md bg-gray-100">
                    <Badge variant="outline" className="px-2 py-1">
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

            <DialogFooter className="flex justify-end space-x-2">
              <Button
                onClick={onClose}
                variant="outline"
                type="button"
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Control'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
