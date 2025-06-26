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
  // triggerControlCalculation, // <--- ELIMINAR ESTA IMPORTACIÓN
  getControlTestResults,
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

  const [controlId, setControlId] = useState(null);
  const [testResults, setTestResults] = useState(null);

  const [createdControlData, setCreatedControlData] = useState(null); // Estado para guardar el control completo

  const mashupOptions = allMashups.map(mashup => ({
    value: mashup.id,
    label: mashup.label || `Mashup ID: ${mashup.id}`,
  }));

  useEffect(() => {
    if (!isOpen) {
      // Resetear estados al cerrar el modal
      setStep(1);
      setTestResults(null);
      setControlId(null);
      setSelectedCatalogId('');
      setSelectedMashupId('');
      setMashupName('');
      setCreatedControlData(null); // Resetear el control completo
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
   * Maneja el flujo completo: crear control (si aplica) y obtener resultados.
   */
  const handleCreateAndTestControl = useCallback(async () => {
    if (!selectedCatalogId || !selectedMashupId) {
      toast.warning('Please select both a catalog and an API Mashup.');
      return;
    }

    setLoading(true);
    try {
      // 1. Crear el control de borrador (si es necesario por el backend)
      // Si el backend no requiere crear un control para obtener resultados,
      // puedes eliminar esta parte y simplemente usar un 'controlId' existente o mock.
      const newControl = await createTestControl(mashupName, selectedCatalogId);
      
      if (!newControl || !newControl.id) { 
          throw new Error('Failed to create control or missing ID from response.');
      }
      
      setCreatedControlData(newControl);
      setControlId(newControl.id); 

      toast.success('Draft control created successfully. Fetching test results...');

      // No hay paso intermedio de 'triggerControlCalculation'

      // 2. Obtener los resultados del test directamente
      // Si el control_id que creamos no es el que el backend usa para devolver
      // resultados ya existentes, deberás usar otro control_id o la lógica cambiará aquí.
      const results = await getControlTestResults(newControl.id); 
      setTestResults(results);
      
      toast.success('Test results fetched!');
      setStep(2); // Pasar al paso de resultados

    } catch (error) {
      console.error('Error during test workflow:', error);
      toast.error(`Test workflow failed: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCatalogId, selectedMashupId, mashupName]);

  const handleCloseModal = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Test API Mashup Workflow</DialogTitle>
          <DialogDescription>
            View test calculations for an API mashup using a specific catalog.
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
              Get Test Results
            </Button>
          </div>
        )}

        {!loading && step === 2 && testResults && (
          <div className="py-4">
            <h3 className="text-lg font-semibold mb-2">Test Results for Control: {controlId}</h3>
            {testResults.length === 0 ? (
              <p className="text-gray-600">No test results or computations found for this control yet.</p>
            ) : (
              <div className="space-y-4 max-h-60 overflow-y-auto border p-2 rounded-md">
                {testResults.map((comp, index) => (
                  <div key={comp.id || index} className="p-3 border rounded-md bg-gray-50">
                    <p className="font-medium">Computation ID: {comp.id}</p>
                    <p>Result: {comp.result || 'N/A'}</p>
                    {comp.evidences && comp.evidences.length > 0 && (
                      <div className="mt-2">
                        <h4 className="font-semibold text-sm">Evidences:</h4>
                        <ul className="list-disc list-inside text-sm">
                          {comp.evidences.map((evidence, evIndex) => (
                            <li key={evIndex}>
                              {evidence.type}: {evidence.value || 'N/A'}
                              {evidence.url && (
                                <a href={evidence.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline ml-2">
                                  (View)
                                </a>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
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