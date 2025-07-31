import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { createDraftCatalog, updateCatalog, getCatalogById, deleteCatalog } from '@/services/catalogs';
import { getControlById, deleteControl, getControlsByCatalogId } from '@/services/controls';
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
  getDraftDashboardUid,
  clearDraftControlIds,
  clearDraftDashboardUid,
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

  const initialDataLoadCompleted = React.useRef(false);

  useEffect(() => {
    initializeControlIdsStorage();
    console.log('CatalogWizard mounted. isEditing:', isEditing);
    if (!isEditing && !initialDataLoadCompleted.current) {
      const draftExists = hasDraftData();
      console.log('Checking for draft data. Exists:', draftExists);
      if (draftExists) {
        setHasDrafts(true);
        setShowDraftDialog(true);
      } else {
        setLoading(false);
      }
    } else if (isEditing && id && !initialDataLoadCompleted.current) {
      console.log('Editing mode. Fetching catalog:', id);
      fetchCatalog(id);
    }
  }, [isEditing, id]);

  const fetchCatalog = useCallback(async (catalogIdToFetch) => {
    setLoading(true);
    console.log('Fetching catalog with ID:', catalogIdToFetch);
    try {
      const catalogResponse = await getCatalogById(catalogIdToFetch);
      console.log('Catalog response:', catalogResponse);
      if (catalogResponse) {
        setCatalogData({
          ...catalogResponse,
          controls: catalogResponse.controls || [],
          dashboardConfig: catalogResponse.dashboardConfig || {}
        });
        if (catalogResponse.dashboard_id) {
          setCatalogData(prev => ({
            ...prev,
            dashboardConfig: { ...prev.dashboardConfig, uid: catalogResponse.dashboard_id }
          }));
        }
        if (!isEditing) {
          fetchDraftControls(catalogResponse.id);
        }
      }
      initialDataLoadCompleted.current = true;
    } catch (err) {
      setError('Failed to load catalog data');
      toast.error('Error loading catalog');
      console.error('Error fetching catalog:', err);
      if (!isEditing) {
        handleDiscardDraft(true);
      }
    } finally {
      setLoading(false);
    }
  }, [isEditing]);

  const fetchDraftControls = useCallback(async (currentCatalogId) => {
    setLoading(true);
    console.log('Fetching draft controls for catalog ID:', currentCatalogId);
    try {
      const controlIds = getDraftControlIds();
      let controlsToLoad = [];

      if (isEditing && currentCatalogId) {
        controlsToLoad = await getControlsByCatalogId(currentCatalogId, 'finalized');
      } else if (controlIds && controlIds.length > 0) {
        for (const controlId of controlIds) {
          try {
            const control = await getControlById(controlId);
            if (control) {
              controlsToLoad.push(control);
            }
          } catch (err) {
            console.error(`Error fetching control with ID ${controlId}:`, err);
          }
        }
      }

      setCatalogData(prev => ({
        ...prev,
        controls: controlsToLoad
      }));

      if (!isEditing && (controlIds.length > 0 || hasDraftDashboardUid())) {
        if (hasDraftDashboardUid()) {
          setCurrentStep(2);
        } else if (controlIds.length > 0) {
          setCurrentStep(1);
        }
      }
    } catch (err) {
      console.error('Error fetching draft controls:', err);
    } finally {
      setLoading(false);
    }
  }, [isEditing]);

  const handleContinueDraft = useCallback(() => {
    setShowDraftDialog(false);
    const draftCatalogId = getDraftCatalogId();
    console.log('Continue draft clicked. Draft Catalog ID from localStorage:', draftCatalogId);
    if (draftCatalogId) {
      fetchCatalog(draftCatalogId);
    } else {
      fetchDraftControls();
      setCurrentStep(1);
    }
  }, [fetchCatalog, fetchDraftControls]);

  const handleDiscardDraft = useCallback(async (navigateToCatalogs = false) => {
    setLoading(true);
    console.log('Discard draft clicked.');
    try {
      const draftCatalogId = getDraftCatalogId();
      if (draftCatalogId) {
        console.log('Deleting draft catalog from API:', draftCatalogId);
        try { await deleteCatalog(draftCatalogId); } catch (err) { console.error('Error deleting draft catalog:', err); }
      }
      const controlIds = getDraftControlIds();
      if (controlIds && controlIds.length > 0) {
        console.log('Deleting draft controls from API:', controlIds);
        for (const controlId of controlIds) {
          try { await deleteControl(controlId); } catch (err) { console.error(`Error deleting draft control ${controlId}:`, err); }
        }
      }
      const dashboardUid = getDraftDashboardUid();
      if (dashboardUid) {
        console.log('Deleting draft dashboard from API:', dashboardUid);
        try { await dashboardsService.delete(dashboardUid); } catch (err) { console.error(`Error deleting draft dashboard ${dashboardUid}:`, err); }
      }

      clearDraftData();
      console.log('All draft data cleared from localStorage.');
      setHasDrafts(false);
      setShowDraftDialog(false);
      setCatalogData({ name: '', description: '', controls: [], dashboardConfig: {} });
      setCurrentStep(0);

      toast.success('Draft catalog discarded');
      if (navigateToCatalogs) {
        navigate('/app/catalogs');
      }
    } catch (err) {
      toast.error('Error discarding draft catalog');
      console.error('Error discarding draft:', err);
    } finally {
      setLoading(false);
      initialDataLoadCompleted.current = false;
    }
  }, [navigate]);

  const goToNextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
    console.log('Moving to next step:', currentStep + 1);
  }, [currentStep]);

  const goToPrevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
    console.log('Moving to previous step:', currentStep - 1);
  }, [currentStep]);

  const handleCatalogInfoSubmit = useCallback(async (catalogInfoData) => {
    setLoading(true);
    setApiError(null);
    console.log('handleCatalogInfoSubmit called with data:', catalogInfoData);
    try {
      let currentCatalogId = isEditing ? id : getDraftCatalogId();
      let response;

      if (currentCatalogId) {
        console.log('Updating existing catalog/draft with ID:', currentCatalogId);
        response = await updateCatalog(currentCatalogId, { ...catalogInfoData, status: 'draft' });
        toast.success('Catalog information updated');
        setCatalogData(prev => ({
          ...prev,
          ...catalogInfoData,
          id: response.id || currentCatalogId
        }));
        goToNextStep();
      } else {
        console.log('Creating new draft catalog.');
        response = await createDraftCatalog(catalogInfoData);
        console.log('Response from createDraftCatalog:', response);
        if (response && response.id) {
          saveDraftCatalogId(response.id);
          console.log('Saved draft catalog ID to localStorage:', response.id);
          initializeControlIdsStorage();
          toast.success('Catalog draft created.');
          setCatalogData(prev => ({
            ...prev,
            ...catalogInfoData,
            id: response.id
          }));
          goToNextStep();
        } else {
          console.error('API did not return a valid catalog ID:', response);
          throw new Error('API did not return a valid catalog ID after creation.');
        }
      }
    } catch (err) {
      let errorMessage = 'Failed to save catalog information';
      if (err.response && err.response.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving catalog information:', err);
    } finally {
      setLoading(false);
    }
  }, [isEditing, id, goToNextStep]);

  const handleControlsSubmit = useCallback(async (controlsData) => {
    setLoading(true);
    setApiError(null);
    console.log('handleControlsSubmit called with controls:', controlsData);
    try {
      setCatalogData(prev => ({
        ...prev,
        controls: controlsData
      }));
      goToNextStep();
    } catch (err) {
      let errorMessage = 'Failed to save controls';
      if (err.response && err.response.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving controls:', err);
    } finally {
      setLoading(false);
    }
  }, [goToNextStep]);

  const handleDashboardSubmit = useCallback(async (dashboardConfigData) => {
    setLoading(true);
    setApiError(null);
    console.log('handleDashboardSubmit called with config:', dashboardConfigData);
    try {
      const currentCatalogId = isEditing ? id : getDraftCatalogId();
      console.log('Finalizing catalog. Retrieved Catalog ID:', currentCatalogId);
      if (!currentCatalogId) {
        throw new Error('No catalog ID found to finalize.');
      }

      const existingCatalog = await getCatalogById(currentCatalogId);
      console.log('Existing catalog for merge:', existingCatalog);

      const updatedCatalogData = {
        ...existingCatalog, // Mantener datos existentes (startDate, endDate, tpaId, status)
        name: dashboardConfigData.title, // Mapear título del dashboard a nombre del catálogo
        description: dashboardConfigData.description, // Mapear descripción del dashboard a descripción del catálogo
        dashboard_id: getDraftDashboardUid(), // Enlazar el UID del dashboard temporal
        status: 'finalized', // Cambiar estado a 'finalized'
      };
      console.log('Updating catalog with final data:', updatedCatalogData);
      await updateCatalog(currentCatalogId, updatedCatalogData);
      toast.success('Catalog created successfully');

      // Mover clearDraftData() AQUÍ, después de que la actualización sea exitosa
      clearDraftData();
      console.log('All draft data cleared after finalization.');
      navigate('/app/catalogs');
    } catch (err) {
      let errorMessage = 'Failed to save dashboard configuration';
      if (err.response && err.response.data) {
        errorMessage = err.response.data.message || err.response.data.error || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [isEditing, id, navigate]);

  const renderStepContent = useCallback(() => {
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
  }, [currentStep, catalogData, handleCatalogInfoSubmit, handleControlsSubmit, handleDashboardSubmit, loading, apiError, isEditing, id]);


  return (
    <Page name={isEditing ? 'Edit Catalog' : 'Create New Catalog'} className="h-full w-full">
      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Borrador de Catálogo Existente</AlertDialogTitle>
            <AlertDialogDescription>
              Se ha detectado un borrador de catálogo. ¿Deseas continuar con él o crear uno nuevo?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => handleDiscardDraft(true)} disabled={loading}>
              {loading ? 'Descartando...' : 'Crear Nuevo'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleContinueDraft}>
              Continuar con Borrador
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
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${index < currentStep
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
              <div className={`ml-2 mr-6 ${index <= currentStep ? 'text-gray-800' : 'text-gray-400'
                }`}>
                {step.title}
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className={`w-12 h-1 mr-2 ${index < currentStep ? 'bg-chart-1' : 'bg-gray-300'
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
          className="border-1 border-gray-500 bg-white text-gray-500 hover:bg-gray-500 hover:text-white"
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
