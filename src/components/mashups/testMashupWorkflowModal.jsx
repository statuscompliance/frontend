// src/components/TestMashupWorkflowModal.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ComboBox } from '@/components/ui/combobox';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import {
  getAllCatalogs,
  createTestControl,
  executeNodeRedMashup, // Importa la función actualizada
} from '@/services/testMashup';

/**
 * Modal for initiating and viewing the results of an API Mashup test workflow.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the modal.
 * @param {function} props.onClose - Callback function to close the modal.
 * @param {Array<object>} props.allMashups - A list of all available Node-RED mashup flows.
 * @param {object | null} props.selectedMashup - The mashup object pre-selected from the table, if any.
 */
export function TestMashupWorkflowModal({ isOpen, onClose, allMashups, selectedMashup }) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [catalogs, setCatalogs] = useState([]);
  const [selectedCatalogId, setSelectedCatalogId] = useState('');

  const [selectedMashupId, setSelectedMashupId] = useState('');
  const [mashupName, setMashupName] = useState('');

  const [controlId, setControlId] = useState(null); // ID del control draft creado
  const [testResults, setTestResults] = useState(null); // Contendrá la respuesta directa del mashup

  const [createdControlData, setCreatedControlData] = useState(null);

  const mashupOptions = allMashups
    // Filtramos si solo quieres mostrar flujos que tienen un endpoint en la segunda posición
    .filter(mashup => mashup.hasOwnProperty('endpoints') && Array.isArray(mashup.endpoints) && mashup.endpoints.length > 1 && mashup.endpoints[1].url)
    .map(mashup => ({
      value: mashup.id,
      label: mashup.label || `Mashup ID: ${mashup.id}`,
      // Extrae el endpoint del segundo elemento del array 'endpoints'
      endpoint: mashup.endpoints[1].url // <-- ¡CORRECCIÓN AQUÍ!
    }));

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setTestResults(null);
      setControlId(null);
      setSelectedCatalogId('');
      setSelectedMashupId('');
      setMashupName('');
      setCreatedControlData(null);
      return;
    }

    if (selectedMashup) {
      setSelectedMashupId(selectedMashup.id);
      setMashupName(selectedMashup.label || `Mashup ID: ${selectedMashup.id}`);
    } else {
      setSelectedMashupId('');
      setMashupName('');
    }

    if (catalogs.length === 0) {
      const fetchCatalogs = async () => {
        setLoading(true);
        try {
          const fetchedCatalogs = await getAllCatalogs();
          if (Array.isArray(fetchedCatalogs)) {
            const processedCatalogs = fetchedCatalogs
              .map(cat => ({
                value: cat.id ? String(cat.id) : `no-id-${Math.random().toString(36).substr(2, 9)}`,
                label: cat.name || `Unnamed Catalog (ID: ${cat.id || 'N/A'})`,
              }))
              .filter(cat => cat.value !== '');

            setCatalogs(processedCatalogs);
            if (processedCatalogs.length > 0) {
              setSelectedCatalogId(processedCatalogs[0].value);
            } else {
              setSelectedCatalogId('');
            }
          } else {
            console.error('getAllCatalogs did not return an array:', fetchedCatalogs);
            setCatalogs([]);
            setSelectedCatalogId('');
          }
        } catch (error) {
          console.error('Error al cargar catálogos (en modal):', error);
          toast.error('Failed to load catalogs.');
          setCatalogs([]);
          setSelectedCatalogId('');
        } finally {
          setLoading(false);
        }
      };
      fetchCatalogs();
    }
  }, [isOpen, selectedMashup, allMashups, catalogs.length]);

  /**
   * Maneja el flujo completo: crear control, llamar directamente al mashup y mostrar resultado.
   */
  const handleCreateAndTestControl = useCallback(async () => {
    if (!selectedCatalogId || !selectedMashupId) {
      toast.warning('Please select both a catalog and an API Mashup.');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear el control draft
      const newControl = await createTestControl(mashupName, selectedCatalogId);

      if (!newControl || !newControl.id || !newControl.params) {
        throw new Error('Failed to create control or missing ID/params from response.');
      }

      setCreatedControlData(newControl);
      setControlId(newControl.id);

      toast.success('Draft control created successfully.');

      // Extraer el threshold de los parámetros del control
      const threshold = newControl.params.threshold;
      if (threshold === undefined || threshold === null) {
        console.warn('Threshold parameter is missing in the created control. Proceeding without it.');
        // Puedes optar por lanzar un error o usar un valor predeterminado si es crítico
        // throw new Error('Threshold parameter is missing in the created control. Cannot test mashup.');
      }
      toast.info(`Preparing to call Node-RED mashup...`);

      // 2. Obtener el endpoint del mashup seleccionado (del segundo elemento del array 'endpoints')
      const currentMashup = mashupOptions.find(opt => opt.value === selectedMashupId);
      if (!currentMashup || !currentMashup.endpoint) {
        throw new Error('Selected mashup does not have a valid endpoint for testing (expected in endpoints[1].url).');
      }


      // 3. Definir el payload a enviar al flujo de Node-RED
      const msgPayload = {
        payload: 'Hello Node-Red from Status Frontend!',
        threshold: threshold
      };

      const currentEndpoint = currentMashup[1].url;

      console.log("Selected Mashup: ", JSON.stringify(currentMashup, null, 2));

      console.log("Selected Mashup Endpoint: ", JSON.stringify(currentEndpoint, null, 2));

      console.log("Payload to send: ", JSON.stringify(msgPayload, null, 2));

      toast.info(`Calling Node-RED mashup endpoint: ${currentEndpoint}`);

      // 4. Ejecutar el mashup de Node-RED usando la función del servicio con el payload
      const mashupResult = await executeNodeRedMashup(currentEndpoint, msgPayload);

      // 5. Mostrar el resultado directo del mashup
      setTestResults(mashupResult);

      toast.success('Mashup executed successfully!');
      setStep(2); // Pasar al paso de resultados

    } catch (error) {
      console.error('Error during Node-RED mashup test workflow:', error);
      // Intenta mostrar el mensaje de error del backend si está disponible
      toast.error(`Mashup test failed: ${error.response?.data?.message || error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCatalogId, selectedMashupId, mashupName, mashupOptions]);

  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Test API Mashup Workflow</DialogTitle>
          <DialogDescription>
            Execute and view results from an API mashup.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            Loading...
          </div>
        )}

        {!loading && step === 1 && (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="catalog" className="text-right">
                Catalog
              </Label>
              <Select
                value={selectedCatalogId}
                onValueChange={setSelectedCatalogId}
                className="col-span-3"
                disabled={catalogs.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a catalog" />
                </SelectTrigger>
                <SelectContent>
                  {catalogs.length === 0 ? (
                    <SelectItem value="" disabled>No catalogs available</SelectItem>
                  ) : (
                    catalogs.map((catalog) => (
                      <SelectItem key={catalog.value} value={catalog.value}>
                        {catalog.label}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mashup" className="text-right">
                API Mashup
              </Label>
              <ComboBox
                options={mashupOptions}
                value={selectedMashupId}
                onValueChange={setSelectedMashupId}
                placeholder="Select an API Mashup..."
                className="col-span-3"
                disabled={allMashups.length === 0 || !!selectedMashup}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mashupName" className="text-right">
                Mashup Name
              </Label>
              <Input
                id="mashupName"
                value={mashupName}
                readOnly
                className="col-span-3 bg-gray-100"
              />
            </div>

            <Button
              onClick={handleCreateAndTestControl}
              disabled={loading || !selectedCatalogId || !selectedMashupId}
              className="mt-4"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Run Mashup Test
            </Button>
          </div>
        )}

        {!loading && step === 2 && testResults && (
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">Mashup Test Result:</h3>
            <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap">
              {/* Intentamos pretty-print JSON, si no, mostramos como string */}
              {typeof testResults === 'object' ? JSON.stringify(testResults, null, 2) : String(testResults)}
            </pre>
            <Button onClick={() => setStep(1)} className="mt-4 mr-2">
              Run Another Test
            </Button>
            <Button variant="outline" onClick={handleCloseModal} className="mt-4">
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}