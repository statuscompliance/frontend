import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ExternalLink, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';

import { EmbeddedControlForm } from '@/forms/control/new/embedded-form';
import { executeNodeRedMashup, getAllNodeRedFlows, createDraftCatalog, deleteDraftCatalog } from '@/services/mashups';
import { deleteControl } from '@/services/controls';
import { v4 as uuidv4 } from 'uuid';

function TestResults({ 
  testResults, 
  loadingTestExecution, 
  mashupDetails, 
  onReset, 
  onClose 
}) {
  if (loadingTestExecution) {
    return (
      <Card className="h-fit w-full">
        <CardHeader>
          <CardTitle>Running Test...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Running mashup test...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (testResults) {
    return (
      <Card className="h-fit w-full">
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
        </CardHeader>
        <CardContent className="w-full overflow-hidden space-y-4">
          <div className="w-full">
            <h4 className="text-md mb-2 font-medium">Complete Response:</h4>
            <pre className="max-h-[400px] max-w-full overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-100 p-3 text-sm">
              {typeof testResults === 'object' ? JSON.stringify(testResults, null, 2) : String(testResults)}
            </pre>
          </div>
          
          {mashupDetails?.id && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => window.open(`/red#flow/${mashupDetails.id}`, '_blank')}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Mashup in Node-RED
              </Button>
            </div>
          )}

          <div className="flex justify-end border-t pt-4 space-x-2">
            <Button variant="outline" onClick={onReset}>
              Create New Control
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close View
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-fit w-full">
      <CardHeader>
        <CardTitle>Mashup Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          The test will run automatically after creating the control.
        </p>
      </CardContent>
    </Card>
  );
}

function LoadingSetup() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="h-fit w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Preparing Test Environment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            <span>Preparing test environment and loading Mashup details...</span>
          </div>
        </CardContent>
      </Card>
      
      <Card className="h-fit w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Mashup Test</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Waiting for environment initialization...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export function ControlCreationAndTestPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mashup } = location.state || {};

  const [draftCatalogId, setDraftCatalogId] = useState(null);
  const [createdControlId, setCreatedControlId] = useState(null);
  const [isFormCreating, setIsFormCreating] = useState(true);
  const [loadingInitialSetup, setLoadingInitialSetup] = useState(false);
  const [loadingTestExecution, setLoadingTestExecution] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [mashupDetails, setMashupDetails] = useState(null);

  useEffect(() => {
    if (!draftCatalogId || !mashupDetails) {
      const initializeEnvironment = async () => {
        setLoadingInitialSetup(true);
        try {
          if (!draftCatalogId) {
            const newCatalog = await createDraftCatalog();
            if (!newCatalog || !newCatalog.id) {
              throw new Error('Could not create draft catalog or missing ID.');
            }
            setDraftCatalogId(newCatalog.id);
          }

          if (mashup && mashup.id && !mashupDetails) {
            const allMashupsResponse = await getAllNodeRedFlows();
            const foundMashup = allMashupsResponse.data.find(m => m.id === mashup.id);
            if (foundMashup) {
              setMashupDetails(foundMashup);
            } else {
              toast.error('No details found for the provided Mashup. Make sure it exists.', { duration: 5000 });
              navigate(-1);
              return;
            }
          }

        } catch (error) {
          toast.error(`Error setting up test environment: ${error.message || 'Unknown error'}`, { duration: 5000 });
          navigate(-1);
        } finally {
          setLoadingInitialSetup(false);
        }
      };
      initializeEnvironment();
    }
  }, [draftCatalogId, mashup, mashupDetails, navigate]);

  // Cleanup function to delete draft resources
  const cleanupDraftResources = useCallback(async () => {
    try {
      if (createdControlId) {
        await deleteControl(createdControlId);
      }
      if (draftCatalogId) {
        await deleteDraftCatalog(draftCatalogId);
      }
    } catch {
      // Silent cleanup - don't show errors to user since they're leaving the page
    }
  }, [createdControlId, draftCatalogId]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup draft resources when component unmounts
      cleanupDraftResources().catch(error => {
        console.error('Error during cleanup:', error);
      });
    };
  }, [cleanupDraftResources]);

  const handleControlCreated = useCallback(async (controlId, formMashupId) => {
    setCreatedControlId(controlId);
    setIsFormCreating(false);
    setTestResults(null);

    if (!mashupDetails || !mashupDetails.endpoint) {
      toast.error('Could not get Mashup URL for execution. Please try again.');
      setLoadingTestExecution(false);
      return;
    }

    setLoadingTestExecution(true);
    toast.loading('Running Node-RED mashup test...', { id: 'mashup-test', duration: 0 });

    try {
      const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:3001/api/v1';
      const computationBackendUrl = `${baseUrl}/computations/bulk`;
      const userData = JSON.parse(localStorage.getItem('userData'));

      const payloadForMashup = {
        endpoint: mashupDetails.endpoint,
        body: {
          backendUrl: computationBackendUrl,
          computationGroup: uuidv4(),
          controlId: controlId
        }
      };

      const computationResponse = await executeNodeRedMashup(
        payloadForMashup.endpoint,
        payloadForMashup.body,
        userData.basicAuth,
        userData.accessToken
      );

      setTestResults(computationResponse);

      toast.success('Mashup executed successfully!', {
        id: 'mashup-test',
        description: (
          <div className="mt-2 max-h-40 overflow-y-auto break-all text-wrap text-xs">
            <h4 className="mb-1 font-semibold">Computation Results:</h4>
            <pre className="whitespace-pre-wrap">{JSON.stringify(computationResponse, null, 2)}</pre>
          </div>
        ),
        duration: 8000
      });

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Mashup test failed: ${errorMessage}`, { id: 'mashup-test', duration: 8000 });
    } finally {
      setLoadingTestExecution(false);
    }
  }, [mashupDetails]);

  const handleReset = useCallback(async () => {
    await cleanupDraftResources();
    setDraftCatalogId(null);
    setCreatedControlId(null);
    setIsFormCreating(true);
    setTestResults(null);
    setLoadingInitialSetup(false);
    setMashupDetails(null);
    toast.info('Test view reset. Ready for new control creation.');
  }, [cleanupDraftResources]);

  const handleClose = useCallback(async () => {
    await cleanupDraftResources();
    navigate(-1);
  }, [navigate, cleanupDraftResources]);

  if (!mashup) {
    return (
      <Page>
        <div className="h-64 flex items-center justify-center">
          <div className="text-center">
            <p className="mb-4 text-muted-foreground">No mashup information found.</p>
            <Button onClick={() => navigate('/app/mashups')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Mashups
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              {isFormCreating 
                ? `${mashup.name || 'Loading...'} Test` 
                : `Mashup Test: ${mashup.name || 'Loading...'}`
              }
            </h1>
          </div>
          <Button variant="outline" onClick={handleClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        {loadingInitialSetup ? (
          <LoadingSetup />
        ) : (
          <>
            {isFormCreating ? (
              draftCatalogId && mashupDetails ? (
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="h-fit w-full overflow-hidden">
                    <CardContent className="w-full overflow-hidden pt-6">
                      <EmbeddedControlForm
                        catalogId={draftCatalogId}
                        onClose={handleClose}
                        onSuccess={handleControlCreated}
                        initialMashupId={mashupDetails.id}
                        mashup={mashupDetails}
                      />
                    </CardContent>
                  </Card>

                  <TestResults
                    testResults={null}
                    loadingTestExecution={false}
                    mashupDetails={mashupDetails}
                    onReset={handleReset}
                    onClose={handleClose}
                  />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <p className="mb-4 text-red-600">Could not load test environment. Try restarting.</p>
                      <Button onClick={handleReset}>Restart Test Environment</Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <div className="max-w-full w-full">
                <TestResults
                  testResults={testResults}
                  loadingTestExecution={loadingTestExecution}
                  mashupDetails={mashupDetails}
                  onReset={handleReset}
                  onClose={handleClose}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Page>
  );
}
