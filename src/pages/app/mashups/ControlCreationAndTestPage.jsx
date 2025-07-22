import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';

import { EmbeddedControlForm } from '@/forms/control/new/embedded-form';
import { executeNodeRedMashup, getAllNodeRedFlows } from '@/services/mashups';
import { createDraftCatalog, deleteCatalog } from '@/services/catalogs';
import { deleteControl } from '@/services/controls';
import { getComputationById } from '@/services/computations';
import { TestResults } from '@/components/mashups/TestResults';
import { PreviousTests } from '@/components/mashups/PreviousTests';
import { useMashupTests } from '@/hooks/use-mashup-tests';
import { v4 as uuidv4 } from 'uuid';

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
  const { addTest, getTestsForMashupSync, deleteTest } = useMashupTests();

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
            const draftCatalogData = {
              name: `Draft Catalog for ${mashup?.name || 'Mashup Test'} - ${new Date().toISOString()}`,
              description: `Temporary catalog created for testing mashup: ${mashup?.name || 'Unknown mashup'}`,
              startDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
              endDate: null
            };
            const newCatalog = await createDraftCatalog(draftCatalogData);
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
        await deleteCatalog(draftCatalogId);
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
      const computationGroupId = uuidv4();

      const payloadForMashup = {
        endpoint: mashupDetails.endpoint,
        body: {
          backendUrl: computationBackendUrl,
          computationGroup: computationGroupId,
          controlId: controlId
        }
      };

      // Execute the mashup
      const mashupResponse = await executeNodeRedMashup(
        payloadForMashup.endpoint,
        payloadForMashup.body,
        userData.basicAuth,
        userData.accessToken
      );

      // Check if mashup execution was successful (status 200)
      if (mashupResponse && (mashupResponse.status === 200 || !mashupResponse.status)) {
        toast.loading('Mashup executed successfully. Fetching computation results...', { 
          id: 'mashup-test', 
          duration: 0 
        });

        try {
          // Fetch the computation results using the computationGroupId
          const computationResponse = await getComputationById(computationGroupId);
          
          // Combine both responses
          const combinedResults = {
            mashupResponse: mashupResponse,
            computationResults: computationResponse
          };

          setTestResults(combinedResults);

          // Save test results to IndexedDB
          if (mashupDetails?.id) {
            await addTest(mashupDetails.id, computationGroupId, combinedResults);
          }

          toast.success('Mashup and computation results retrieved successfully!', {
            id: 'mashup-test',
            description: (
              <div className="mt-2 max-h-40 overflow-y-auto break-all text-wrap text-xs">
                <h4 className="mb-1 font-semibold">Results:</h4>
                <p>Mashup: {mashupResponse ? 'Success' : 'No response'}</p>
                <p>Computations: {computationResponse ? 'Retrieved' : 'No data'}</p>
              </div>
            ),
            duration: 8000
          });

        } catch (computationError) {
          console.warn('Failed to fetch computation results:', computationError);
          
          // Still show mashup results even if computation fetch fails
          setTestResults(mashupResponse);
          
          // Save partial test results to IndexedDB
          if (mashupDetails?.id) {
            await addTest(mashupDetails.id, computationGroupId, mashupResponse);
          }
          
          toast.success('Mashup executed successfully!', {
            id: 'mashup-test',
            description: (
              <div className="mt-2 max-h-40 overflow-y-auto break-all text-wrap text-xs">
                <h4 className="mb-1 font-semibold">Mashup Results:</h4>
                <pre className="whitespace-pre-wrap">{JSON.stringify(mashupResponse, null, 2)}</pre>
                <p className="mt-1 text-yellow-600">Note: Could not fetch computation results.</p>
              </div>
            ),
            duration: 8000
          });
        }
      } else {
        // Mashup execution failed
        setTestResults(mashupResponse);
        toast.error('Mashup execution completed with errors', { 
          id: 'mashup-test', 
          duration: 8000 
        });
      }

    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`Mashup test failed: ${errorMessage}`, { id: 'mashup-test', duration: 8000 });
      setTestResults({ error: errorMessage, originalError: error });
    } finally {
      setLoadingTestExecution(false);
    }
  }, [mashupDetails, addTest]);

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

  const handleViewTest = useCallback((test) => {
    setTestResults(test.results);
    setIsFormCreating(false);
  }, []);

  const handleDeleteTest = useCallback(async (testId) => {
    if (mashupDetails?.id) {
      try {
        await deleteTest(mashupDetails.id, testId);
        toast.success('Test deleted successfully');
      } catch (error) {
        console.error('Error deleting test:', error);
        toast.error('Failed to delete test');
      }
    }
  }, [mashupDetails?.id, deleteTest]);

  const previousTests = mashupDetails?.id ? getTestsForMashupSync(mashupDetails.id) : [];

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
                : `Test Results: ${mashup.name || 'Loading...'}`
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

                  <PreviousTests
                    tests={previousTests}
                    onDeleteTest={handleDeleteTest}
                    onViewTest={handleViewTest}
                    mashupName={mashupDetails?.name || 'Unknown Mashup'}
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
