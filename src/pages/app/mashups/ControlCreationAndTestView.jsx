import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react'; // Import ExternalLink
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';

import { NewControlForm } from '@/forms/control/new/form'; // Your control creation form
import { executeNodeRedMashup, getAllNodeRedFlows, createDraftCatalog } from '@/services/mashups'; // Required services
import { v4 as uuidv4 } from 'uuid'; // Import v4

export function ControlCreationAndTestView({ mashup, isOpen, onClose }) {
    const [draftCatalogId, setDraftCatalogId] = useState(null);
    const [isFormCreating, setIsFormCreating] = useState(true);
    const [loadingInitialSetup, setLoadingInitialSetup] = useState(false);
    const [loadingTestExecution, setLoadingTestExecution] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [mashupDetails, setMashupDetails] = useState(null);

    // 1. Effect to initialize the draft catalog and get mashup details when the view opens
    useEffect(() => {
        if (isOpen && (!draftCatalogId || !mashupDetails)) { // Only if open and missing data
            const initializeEnvironment = async () => {
                setLoadingInitialSetup(true);
                try {
                    // Create draft catalog
                    if (!draftCatalogId) {
                        const newCatalog = await createDraftCatalog();
                        if (!newCatalog || !newCatalog.id) {
                            throw new Error('Could not create draft catalog or missing ID.');
                        }
                        setDraftCatalogId(newCatalog.id);
                        toast.success(`Test setup: Draft catalog "${newCatalog.name}" ready.`, { duration: 3000 });
                    }

                    // Get full mashup details
                    if (mashup && mashup.id && !mashupDetails) {
                        const allMashupsResponse = await getAllNodeRedFlows();
                        const foundMashup = allMashupsResponse.data.find(m => m.id === mashup.id);
                        console.log("Found Mashup: ", JSON.stringify(foundMashup, 2, null));
                        if (foundMashup) {
                            setMashupDetails(foundMashup);
                        } else {
                            toast.error('No details found for the provided Mashup. Make sure it exists.', { duration: 5000 });
                            onClose(); // Close if mashup not found
                            return; // Exit to avoid further errors
                        }
                    }

                } catch (error) {
                    console.error('Error setting up test environment:', error);
                    toast.error(`Error setting up test environment: ${error.message || 'Unknown error'}`, { duration: 5000 });
                    onClose(); // Close view if critical initialization fails
                } finally {
                    setLoadingInitialSetup(false);
                }
            };
            initializeEnvironment();
        }
    }, [isOpen, draftCatalogId, mashup, mashupDetails, onClose]);


    const handleControlCreated = useCallback(async (controlId, formMashupId) => {
        console.log('[ControlCreationAndTestView] handleControlCreated called. controlId:', controlId, 'formMashupId:', formMashupId);
        setIsFormCreating(false);
        setTestResults(null);

        console.log("Mashup Details to execute: ", JSON.stringify(mashupDetails, null, 2));

        if (!mashupDetails || !mashupDetails.endpoint) {
            toast.error('Could not get Mashup URL for execution. Please try again.');
            console.error('[ControlCreationAndTestView] Error: invalid mashupDetails or missing URL for test execution.');
            setLoadingTestExecution(false);
            return;
        }

        setLoadingTestExecution(true);
        toast.loading('Running Node-RED mashup test...', { id: 'mashup-test', duration: 0 });

        try {
            const computationBackendUrl = "http://status-backend:3001/api/v1/computations/bulk";

            const userData = JSON.parse(localStorage.getItem("userData"));

            console.log("Current User Data: ", JSON.stringify(userData, null, 2));

            const payloadForMashup = {
                endpoint: mashupDetails.endpoint,
                body: {
                    backendUrl: computationBackendUrl,
                    computationGroup: uuidv4(),
                    controlId: controlId
                }
            };

            console.log('[ControlCreationAndTestView] Starting mashup execution with endpoint:', payloadForMashup.endpoint, 'and payload (params):', payloadForMashup.params);
            const computationResponse = await executeNodeRedMashup(
                payloadForMashup.endpoint,
                payloadForMashup.body,
                userData.basicAuth,
                userData.accessToken
            );

            // Store the entire computation response
            setTestResults(computationResponse);
            console.log('[ControlCreationAndTestView] Mashup executed successfully. Computation response:', computationResponse);

            toast.success('Mashup executed successfully!', {
                id: 'mashup-test',
                description: (
                    <div className="mt-2 text-xs text-wrap break-all max-h-40 overflow-y-auto">
                        <h4 className="font-semibold mb-1">Computation Results:</h4>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(computationResponse, null, 2)}</pre>
                    </div>
                ),
                duration: 8000
            });

        } catch (error) {
            console.error('[ControlCreationAndTestView] Error during Node-RED mashup test execution:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            toast.error(`Mashup test failed: ${errorMessage}`, { id: 'mashup-test', duration: 8000 });
        } finally {
            setLoadingTestExecution(false);
            console.log('[ControlCreationAndTestView] Mashup execution finished. loadingTestExecution is false.');
        }

    }, [mashupDetails, draftCatalogId]);

    // Callback to reset the view and allow creation of a new control
    const handleReset = useCallback(() => {
        setDraftCatalogId(null); // This will force creation of a new draft catalog
        setIsFormCreating(true);
        setTestResults(null);
        setLoadingInitialSetup(false); // Make sure to reset to re-trigger initialization effect
        setMashupDetails(null); // Also reset mashup details
        toast.info('Test view reset. Ready for new control creation.');
    }, []);

    // Main Dialog rendering
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                className="max-w-[800px] w-full p-6 max-h-[90vh] overflow-y-auto"
                aria-describedby="control-creation-dialog-description"
            >
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        {isFormCreating ? `Create Control for Mashup: ${mashup?.name || 'Loading...'}` : `Mashup Test: ${mashup?.name || 'Loading...'}`}
                    </DialogTitle>
                    <DialogDescription id="control-creation-dialog-description">
                        {isFormCreating ? 'Create a new control associated with a draft catalog to start the test.' : 'Control created. Running or showing mashup test results.'}
                    </DialogDescription>
                </DialogHeader>

                {loadingInitialSetup ? (
                    <div className="flex justify-center items-center h-40">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        Preparing test environment and loading Mashup details...
                    </div>
                ) : (
                    <>
                        {isFormCreating ? (
                            draftCatalogId && mashupDetails ? (
                                <NewControlForm
                                    catalogId={draftCatalogId}
                                    onClose={onClose}
                                    onSuccess={handleControlCreated}
                                    initialMashupId={mashupDetails.id}
                                />
                            ) : (
                                <div className="flex justify-center items-center h-40 text-red-600">
                                    <p>Could not load test environment. Try resetting.</p>
                                    <Button className="mt-2" onClick={handleReset}>Reset Test Environment</Button>
                                </div>
                            )
                        ) : (
                            <div className="space-y-4 pt-4">
                                <h3 className="text-lg font-medium border-b pb-2 mb-2">Mashup Test Results</h3>
                                {loadingTestExecution ? (
                                    <div className="flex justify-center items-center py-4">
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Running test...
                                    </div>
                                ) : testResults ? (
                                    <div>
                                        <h4 className="text-md font-medium mb-2">Full Computation Response:</h4>
                                        <pre className="bg-gray-100 p-3 rounded-md text-sm whitespace-pre-wrap max-h-[300px] overflow-auto">
                                            {/* Make sure to show all response information */}
                                            {typeof testResults === 'object' ? JSON.stringify(testResults, null, 2) : String(testResults)}
                                        </pre>
                                        {/* Button to view Mashup in Node-RED */}
                                        {mashupDetails?.id && (
                                            <div className="mt-4 flex justify-end">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => window.open(`/red#flow/${mashupDetails.id}`, '_blank')}
                                                >
                                                    <ExternalLink className="mr-2 h-4 w-4" /> View Mashup in Node-RED
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p>The mashup test has finished or no results were obtained.</p>
                                )}

                                <div className="flex justify-end space-x-2 mt-4">
                                    <Button variant="outline" onClick={handleReset} disabled={loadingTestExecution}>
                                        Create New Control / Reset Test
                                    </Button>
                                    <Button variant="outline" onClick={onClose} disabled={loadingTestExecution}>
                                        Close Test View
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
