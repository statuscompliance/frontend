import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { createDraftCatalog, updateCatalog, getCatalogById, deleteCatalog } from '@/services/catalogs';
import { getControlById, deleteControl } from '@/services/controls';
import { dashboardsService } from '@/services/grafana/dashboards';
import { CatalogInfoStep } from '@/components/catalog/CatalogInfoStep';
import { CatalogControlsStep } from '@/components/catalog/CatalogControlsStep';
import { CatalogDashboardStep } from '@/components/catalog/CatalogDashboardStep';
import { 
  getDraftCatalogId, 
  getDraftControlIds, 
  clearDraftData, 
  hasDraftData,
  saveDraftCatalogId,
  initializeControlIdsStorage,
  hasDraftDashboardUid,
  getDraftDashboardUid
} from '@/utils/draftStorage';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const isDev = !!import.meta.env.DEV;

const steps = [
  { id: 'info', title: 'Catalog Information' },
  { id: 'controls', title: 'Controls' },
  { id: 'dashboard', title: 'Dashboard' },
];

export function CatalogWizard() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(isEditing);
  const [error, setError] = useState(null);
  const [catalogData, setCatalogData] = useState({
    name: '',
    description: '',
    controls: [],
    dashboardConfig: {}
  });
  const [apiError, setApiError] = useState(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const initialFetchCompleted = useRef(false);
  const controlsFetchCompleted = useRef(false);

  // Check for draft data on component mount
  useEffect(() => {
    // Initialize control_draft_ids storage
    initializeControlIdsStorage();
    
    // Only check for drafts if we're not in edit mode
    if (!isEditing) {
      const draftExists = hasDraftData();
      setHasDrafts(draftExists);
      
      // Ya no mostramos automáticamente el diálogo, ahora sólo verificamos si hay un borrador
      if (draftExists) {
        setHasDrafts(true);
      }
    }
  }, [isEditing]);

  // Fetch catalog data if editing or if we have a draft
  useEffect(() => {
    const fetchCatalog = async () => {
      if (initialFetchCompleted.current) return;
      
      try {
        setLoading(true);
        let catalogResponse = null;
        
        if (isEditing) {
          // Normal edit mode using URL parameter
          catalogResponse = await getCatalogById(id);
        } else if (hasDrafts && !showDraftDialog) {
          // After user confirmed to continue with draft
          const draftCatalogId = getDraftCatalogId();
          if (draftCatalogId) {
            catalogResponse = await getCatalogById(draftCatalogId);
          }
        }
        
        if (catalogResponse) {
          setCatalogData({
            ...catalogResponse,
            controls: catalogResponse.controls || [],
            dashboardConfig: catalogResponse.dashboardConfig || {}
          });
        }
        
        initialFetchCompleted.current = true;
      } catch (err) {
        setError('Failed to load catalog data');
        toast.error('Error loading catalog');
        console.error('Error fetching catalog:', err);
      } finally {
        setLoading(false);
      }
    };

    if ((isEditing || (hasDrafts && !showDraftDialog)) && !loading && !initialFetchCompleted.current) {
      fetchCatalog();
    }
  }, [id, isEditing, hasDrafts, showDraftDialog, loading]);

  // Fetch draft controls if we have them
  useEffect(() => {
    const fetchDraftControls = async () => {
      if (controlsFetchCompleted.current) return;
      
      try {
        setLoading(true);
        const controlIds = getDraftControlIds();
        
        if (controlIds && controlIds.length > 0) {
          const controls = [];
          
          for (const controlId of controlIds) {
            try {
              const control = await getControlById(controlId);
              if (control) {
                controls.push(control);
              }
            } catch (err) {
              console.error(`Error fetching control with ID ${controlId}:`, err);
            }
          }
          
          if (controls.length > 0) {
            setCatalogData(prev => ({
              ...prev,
              controls
            }));
            
            if (hasDrafts && !showDraftDialog) {
              // Check if we have a dashboard draft and redirect to dashboard step if so
              if (hasDraftDashboardUid()) {
                setCurrentStep(2); // Dashboard step
              } else {
                setCurrentStep(1); // Controls step
              }
            }
          } else if (hasDrafts && !showDraftDialog) {
            // Check if we have a dashboard draft and redirect to dashboard step if so
            if (hasDraftDashboardUid()) {
              setCurrentStep(2); // Dashboard step
            } else {
              setCurrentStep(1); // Controls step
            }
          }
        } else if (hasDrafts && !showDraftDialog) {
          // Check if we have a dashboard draft and redirect to dashboard step if so
          if (hasDraftDashboardUid()) {
            setCurrentStep(2); // Dashboard step
          } else {
            setCurrentStep(1); // Controls step
          }
        }
        
        controlsFetchCompleted.current = true;
      } catch (err) {
        console.error('Error fetching draft controls:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (!isEditing && hasDrafts && !showDraftDialog && !controlsFetchCompleted.current) {
      fetchDraftControls();
    }
  }, [isEditing, hasDrafts, showDraftDialog]);

  const handleContinueDraft = () => {
    setShowDraftDialog(false);
    
    // Check if we have a dashboard draft and directly go to dashboard step if needed
    if (hasDraftDashboardUid()) {
      setCurrentStep(2); // Dashboard step
    }
  };

  const handleDiscardDraft = async () => {
    try {
      setLoading(true);
      
      // Delete catalog draft if it exists
      const draftCatalogId = getDraftCatalogId();
      if (draftCatalogId) {
        try {
          await deleteCatalog(draftCatalogId);
        } catch (err) {
          console.error('Error deleting draft catalog:', err);
        }
      }
      
      // Delete control drafts if they exist
      const controlIds = getDraftControlIds();
      for (const controlId of controlIds) {
        try {
          await deleteControl(controlId);
        } catch (err) {
          console.error(`Error deleting draft control ${controlId}:`, err);
        }
      }
      
      // Delete dashboard draft if it exists
      const dashboardUid = getDraftDashboardUid();
      console.log('Draft dashboard UID:', dashboardUid);
      if (dashboardUid) {
        try {
          await dashboardsService.delete(dashboardUid);
        } catch (err) {
          console.error(`Error deleting draft dashboard ${dashboardUid}:`, err);
        }
      }
      
      // Clear localStorage
      clearDraftData();
      
      // Reset state and navigate back to catalogs list
      setHasDrafts(false);
      setShowDraftDialog(false);
      
      navigate('/app/catalogs');
      
      toast.success('Draft catalog discarded');
    } catch (err) {
      toast.error('Error discarding draft catalog');
      console.error('Error discarding draft:', err);
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleCatalogInfoSubmit = async (catalogInfo) => {
    try {
      setLoading(true);
      setApiError(null);
      
      // If first step and not editing, create new catalog
      if (currentStep === 0 && !isEditing) {
        const response = await createDraftCatalog(catalogInfo);
        
        // Here we'll save the catalog ID immediately after creation
        if (response && response.id) {
          // Initialize localStorage storage
          saveDraftCatalogId(response.id);
          initializeControlIdsStorage();
        }
        
        setCatalogData({
          ...response,
          controls: [],
          dashboardConfig: {}
        });
        toast.success('Catalog information saved');
        goToNextStep();
      } else {
        // Otherwise just update local state
        setCatalogData(prev => ({
          ...prev,
          ...catalogInfo
        }));
        toast.success('Catalog information updated');
        goToNextStep();
      }
    } catch (err) {
      let errorMessage = 'Failed to save catalog information';
      
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving catalog information:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleControlsSubmit = async (controls) => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Update catalog with controls
      const updatedData = {
        ...catalogData,
        controls
      };
      
      if (isEditing) {
        await updateCatalog(id, { controls });
      } else if (catalogData && catalogData.id) {
        // Save catalog ID again for non-editing mode
        saveDraftCatalogId(catalogData.id);
      }
      
      setCatalogData(updatedData);
      toast.success('Controls saved successfully');
      goToNextStep();
    } catch (err) {
      let errorMessage = 'Failed to save controls';
      
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving controls:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDashboardSubmit = async (dashboardConfig) => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Update catalog with dashboard configuration
      const updatedData = {
        ...catalogData,
        dashboardConfig
      };
      
      if (isEditing) {
        await updateCatalog(id, { dashboardConfig });
      }
      
      setCatalogData(updatedData);
      toast.success('Catalog created successfully');
      
      // Clear draft data on successful completion
      clearDraftData();
      
      // Navigate back to catalogs list
      navigate('/app/catalogs');
    } catch (err) {
      let errorMessage = 'Failed to save dashboard configuration';
      
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.data && err.response.data.error) {
          errorMessage = err.response.data.error;
        }
      }
      
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving dashboard:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (currentStep) {
    case 0:
      return (
        <CatalogInfoStep 
          initialData={catalogData} 
          onSubmit={handleCatalogInfoSubmit} 
          isSubmitting={loading}
          apiError={apiError}
        />
      );
    case 1:
      return (
        <CatalogControlsStep 
          initialControls={catalogData.controls} 
          catalogId={isEditing ? id : catalogData.id}
          onSubmit={handleControlsSubmit} 
          isSubmitting={loading}
          apiError={apiError}
          key={`controls-${isEditing ? id : catalogData.id}`}
        />
      );
    case 2:
      return (
        <CatalogDashboardStep 
          initialConfig={catalogData.dashboardConfig} 
          catalogId={isEditing ? id : catalogData.id}
          controls={catalogData.controls}
          onSubmit={handleDashboardSubmit} 
          isSubmitting={loading}
          apiError={apiError}
        />
      );
    default:
      return null;
    }
  };

  return (
    <Page name={isEditing ? 'Edit Catalog' : 'Create New Catalog'} className="h-full w-full">
      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfinished Catalog Found</AlertDialogTitle>
            <AlertDialogDescription>
              We found a catalog that you started creating but didn&apos;t finish. Would you like to continue where you left off?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardDraft} disabled={loading}>
              {loading ? 'Discarding...' : 'Discard Draft'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDraft}>
              Continue Draft
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              {/* Step circle */}
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  index < currentStep
                    ? 'bg-chart-1 border-chart-1 text-white'
                    : index === currentStep
                      ? 'border-chart-5 text-chart-5'
                      : 'border-gray-300 text-gray-300'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              
              {/* Step title */}
              <div className={`ml-2 mr-6 ${
                index <= currentStep ? 'text-gray-800' : 'text-gray-400'
              }`}>
                {step.title}
              </div>
              
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mr-2 ${
                  index < currentStep ? 'bg-chart-1' : 'bg-gray-300'
                }`}></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 border border-red-400 rounded bg-red-100 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {loading && (showDraftDialog || (currentStep === 0 && (isEditing || hasDrafts))) ? (
            <div className="h-60 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons - Only shown for manually navigation */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep === 0 ? navigate('/app/catalogs') : goToPrevStep()}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous Step'}
        </Button>
        
        {/* This button is just for manual navigation during development */}
        {isDev && (
          <Button
            onClick={goToNextStep}
            disabled={loading || currentStep === steps.length - 1}
          >
            Next (Dev Only)
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </Page>
  );
}
