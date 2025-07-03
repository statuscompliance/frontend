import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react'; // Importa ExternalLink
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import { NewControlForm } from '@/forms/control/new/form'; // Tu formulario de creación de control
import { executeNodeRedMashup, getAllNodeRedFlows, createDraftCatalog } from '@/services/mashups'; // Servicios necesarios

export function ControlCreationAndTestView({ mashup, isOpen, onClose }) {
    const [draftCatalogId, setDraftCatalogId] = useState(null);
    const [isFormCreating, setIsFormCreating] = useState(true);
    const [loadingInitialSetup, setLoadingInitialSetup] = useState(false);
    const [loadingTestExecution, setLoadingTestExecution] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [mashupDetails, setMashupDetails] = useState(null);

    // 1. Efecto para inicializar el catálogo borrador y obtener los detalles del mashup cuando la vista se abre
    useEffect(() => {
        if (isOpen && (!draftCatalogId || !mashupDetails)) { // Solo si está abierta y faltan datos
            const initializeEnvironment = async () => {
                setLoadingInitialSetup(true);
                try {
                    // Crear catálogo borrador
                    if (!draftCatalogId) {
                        const newCatalog = await createDraftCatalog();
                        if (!newCatalog || !newCatalog.id) {
                            throw new Error('No se pudo crear el catálogo borrador o falta el ID.');
                        }
                        setDraftCatalogId(newCatalog.id);
                        toast.success(`Configuración de prueba: Catálogo borrador "${newCatalog.name}" listo.`, { duration: 3000 });
                    }

                    // Obtener detalles completos del mashup
                    if (mashup && mashup.id && !mashupDetails) {
                        const allMashupsResponse = await getAllNodeRedFlows();
                        const foundMashup = allMashupsResponse.data.find(m => m.id === mashup.id);
                        if (foundMashup) {
                            setMashupDetails(foundMashup);
                        } else {
                            toast.error('No se encontraron detalles del Mashup proporcionado. Asegúrate de que existe.', { duration: 5000 });
                            onClose(); // Cerrar si no se encuentra el mashup
                            return; // Salir para evitar más errores
                        }
                    }

                } catch (error) {
                    console.error('Error al configurar el entorno de prueba:', error);
                    toast.error(`Error al configurar el entorno de prueba: ${error.message || 'Error desconocido'}`, { duration: 5000 });
                    onClose(); // Cerrar la vista si falla la inicialización crítica
                } finally {
                    setLoadingInitialSetup(false);
                }
            };
            initializeEnvironment();
        }
    }, [isOpen, draftCatalogId, mashup, mashupDetails, onClose]);


    // Callback que se ejecuta cuando el control es creado exitosamente en el formulario
    const handleControlCreated = useCallback(async (controlId, formMashupId) => {
        console.log('[ControlCreationAndTestView] Mashup details: ', JSON.stringify(mashupDetails, null, 2));
        console.log('[ControlCreationAndTestView] handleControlCreated llamado. controlId:', controlId, 'formMashupId:', formMashupId);
        setIsFormCreating(false); // Cambiamos a la fase de visualización de resultados
        setTestResults(null); // Limpiamos resultados anteriores

        // Aseguramos que tenemos los detalles completos del mashup antes de ejecutar
        if (!mashupDetails || mashupDetails.id !== formMashupId || !mashupDetails.endpoint) {
            toast.error('No se pudo obtener la URL del Mashup para la ejecución. Inténtalo de nuevo.');
            console.error('Error: mashupDetails no válido o URL faltante para la ejecución del test.');
            setLoadingTestExecution(false); // Asegúrate de que el spinner se desactive
            return;
        }

        setLoadingTestExecution(true);
        toast.loading('Ejecutando prueba del mashup de Node-RED...', { id: 'mashup-test', duration: 0 }); // Toast persistente

        try {
            // Prepara el payload para el mashup de Node-RED.
            // Puedes ajustar esto según lo que tu Node-RED espere.
            const payloadForMashup = {
                payload: `Test execution for Control ID: ${controlId} - ${new Date().toLocaleString()}`,
                controlId: controlId,
                mashupId: formMashupId,
                catalogId: draftCatalogId,
                // Puedes añadir aquí otros parámetros relevantes para tu test
            };

            console.log('[ControlCreationAndTestView] Ejecutando mashup con URL:', mashupDetails.endpoint, 'y payload:', payloadForMashup);
            const mashupResult = await executeNodeRedMashup(mashupDetails.endpoint, payloadForMashup);

            setTestResults(mashupResult);
            toast.success('¡Mashup ejecutado exitosamente!', {
                id: 'mashup-test',
                description: (
                    <div className="mt-2 text-xs text-wrap break-all max-h-40 overflow-y-auto">
                        <h4 className="font-semibold mb-1">Resultados:</h4>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(mashupResult, null, 2)}</pre>
                    </div>
                ),
                duration: 8000 // Deja el toast más tiempo para leer los resultados
            });

        } catch (error) {
            console.error('Error durante la ejecución de la prueba del mashup de Node-RED:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
            toast.error(`La prueba del mashup falló: ${errorMessage}`, { id: 'mashup-test', duration: 8000 });
        } finally {
            setLoadingTestExecution(false);
            console.log('[ControlCreationAndTestView] Ejecución del mashup finalizada. loadingTestExecution es false.');
        }
    }, [mashupDetails, draftCatalogId]); // Dependencias del useCallback

    // Callback para reiniciar la vista y permitir la creación de un nuevo control
    const handleReset = useCallback(() => {
        setDraftCatalogId(null); // Esto forzará la creación de un nuevo catálogo borrador
        setIsFormCreating(true);
        setTestResults(null);
        setLoadingInitialSetup(false); // Asegúrate de que se reinicie para re-ejecutar el efecto de inicialización
        setMashupDetails(null); // Reinicia también los detalles del mashup
        toast.info('Vista de prueba reiniciada. Lista para la creación de un nuevo control.');
    }, []);

    // Renderizado del Diálogo Principal
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-[800px] w-full p-6 max-h-[90vh] overflow-y-auto"
                aria-describedby="control-creation-dialog-description"
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {isFormCreating ? `Crear Control para Mashup: ${mashup?.name || 'Cargando...'}` : `Testeo de Mashup: ${mashup?.name || 'Cargando...'}`}
                    </DialogTitle>
                    <DialogDescription id="control-creation-dialog-description">
                        {isFormCreating ? 'Crea un nuevo control asociado a un catálogo borrador para iniciar el test.' : 'Control creado. Ejecutando o mostrando resultados de la prueba del mashup.'}
                    </DialogDescription>
                </DialogHeader>

                {loadingInitialSetup ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Preparando entorno de prueba y cargando detalles del Mashup...
                    </div>
                ) : (
                    <>
                        {isFormCreating ? (
                            // Solo renderizamos el formulario si el draftCatalogId y mashupDetails están disponibles
                            draftCatalogId && mashupDetails ? (
                                <NewControlForm
                                    catalogId={draftCatalogId}
                                    onClose={onClose}
                                    onSuccess={handleControlCreated}
                                    mashupIdPreselected={mashupDetails.id} // Pasa el ID del mashup completo
                                />
                            ) : (
                                <div className="flex justify-center items-center h-40 text-red-600">
                                    <p>No se pudo cargar el entorno de prueba. Intenta reiniciar.</p>
                                </div>
                            )
                        ) : (
                            // Sección para mostrar los resultados de la prueba
                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-medium border-b pb-2 mb-2">Resultados del Test de Mashup</h3>
                                {loadingTestExecution ? (
                                    <div className="flex justify-center items-center py-4">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Ejecutando prueba...
                                    </div>
                                ) : testResults ? (
                                    <div>
                                        <h4 className="text-md font-medium mb-2">Respuesta del Mashup:</h4>
                                        <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                                            {typeof testResults === 'object' ? JSON.stringify(testResults, null, 2) : String(testResults)}
                                        </pre>
                                        {/* Botón para ver el Mashup en Node-RED */}
                                        {mashupDetails?.id && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => window.open(`/red#flow/${mashupDetails.id}`, '_blank')}
                                                >
                                                    <ExternalLink className="mr-2 h-4 w-4" /> Ver Mashup en Node-RED
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>La prueba del mashup ha finalizado o no se obtuvieron resultados.</p>
                                )}

                                <div className="flex justify-end space-x-2 mt-4">
                                    <Button variant="outline" onClick={handleReset} disabled={loadingTestExecution}>
                                        Crear Nuevo Control / Reiniciar Prueba
                                    </Button>
                                    <Button variant="outline" onClick={onClose} disabled={loadingTestExecution}>
                                        Cerrar Vista de Prueba
                                    </Button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
