import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { ArrowLeft, Check, Loader2 } from 'lucide-react';
import { LinkerDatasourcesStep } from '@/components/linker/LinkerDatasourcesStep';
import { LinkerMappingStep } from '@/components/linker/LinkerMappingStep';
import { createLinker } from '@/services/linkers';
import {
  hasLinkerDraft,
  getLinkerDraft,
  saveLinkerInfo,
  saveLinkerDatasources,
  clearLinkerDraft,
} from '@/utils/linkerDraftStorage';

const steps = [
  { id: 'config', title: 'Configuration' },
  { id: 'mapping', title: 'Data Mapping' },
];

export function LinkerCreate() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [linkerData, setLinkerData] = useState({
    name: '',
    description: '',
    environment: 'dev',
    datasources: [],
    mapping: {}
  });
  const [apiError, setApiError] = useState(null);
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [hasDrafts, setHasDrafts] = useState(false);
  const initialFetchCompleted = useRef(false);

  // Check for draft data on component mount
  useEffect(() => {
    if (!initialFetchCompleted.current) {
      const draftExists = hasLinkerDraft();
      setHasDrafts(draftExists);
      
      if (draftExists) {
        setShowDraftDialog(true);
      }
      
      initialFetchCompleted.current = true;
    }
  }, []);

  const handleContinueDraft = () => {
    const draft = getLinkerDraft();
    
    if (draft.info) {
      setLinkerData(prev => ({
        ...prev,
        ...draft.info
      }));
    }
    
    if (draft.datasources && draft.datasources.length > 0) {
      setLinkerData(prev => ({
        ...prev,
        datasources: draft.datasources
      }));
    }
    
    if (draft.mapping) {
      setLinkerData(prev => ({
        ...prev,
        mapping: draft.mapping
      }));
    }
    
    setShowDraftDialog(false);
    setHasDrafts(false);
  };

  const handleDiscardDraft = () => {
    clearLinkerDraft();
    setHasDrafts(false);
    setShowDraftDialog(false);
    toast.success('Draft discarded');
  };

  const goToNextStep = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleConfigSubmit = async (configData) => {
    try {
      setLoading(true);
      setApiError(null);
      
      // configData contains both info (name, description, environment) and datasources
      const { datasources, ...linkerInfo } = configData;
      
      // Save to localStorage
      saveLinkerInfo(linkerInfo);
      saveLinkerDatasources(datasources);
      
      setLinkerData(prev => ({
        ...prev,
        ...linkerInfo,
        datasources
      }));
      
      toast.success('Configuration saved successfully');
      goToNextStep();
    } catch (err) {
      const errorMessage = err.message || 'Failed to save configuration';
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error saving configuration:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingSubmit = async (mapping) => {
    try {
      setLoading(true);
      setApiError(null);
      
      // Prepare linker data for creation
      const linkerPayload = {
        name: linkerData.name || undefined,
        description: linkerData.description || undefined,
        environment: linkerData.environment,
        datasourceIds: linkerData.datasources.map(ds => ds.datasourceId),
        defaultMethodName: 'default', // Can be configured in future
        datasourceConfigs: {}, // Required field (can be empty object)
      };
      
      await createLinker(linkerPayload);
      toast.success('Linker created successfully');
      
      // Clear draft data on successful completion
      clearLinkerDraft();
      
      // Navigate back to linkers list
      navigate('/app/linkers');
    } catch (err) {
      const errorMessage = err.message || 'Failed to create linker';
      setApiError(errorMessage);
      toast.error(errorMessage);
      console.error('Error creating linker:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
    case 0:
      return (
        <LinkerDatasourcesStep 
          initialData={linkerData}
          initialDatasources={linkerData.datasources} 
          onSubmit={handleConfigSubmit} 
          isSubmitting={loading}
          apiError={apiError}
        />
      );
    case 1:
      return (
        <LinkerMappingStep 
          initialMapping={linkerData.mapping}
          datasources={linkerData.datasources}
          onSubmit={handleMappingSubmit} 
          isSubmitting={loading}
          apiError={apiError}
        />
      );
    default:
      return null;
    }
  };

  return (
    <Page name="Create New Linker" className="h-full w-full">
      {/* Draft Recovery Dialog */}
      <AlertDialog open={showDraftDialog} onOpenChange={setShowDraftDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unfinished Linker Found</AlertDialogTitle>
            <AlertDialogDescription>
              We found a linker that you started creating but didn&apos;t finish. Would you like to continue where you left off?
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
          {loading && showDraftDialog ? (
            <div className="h-60 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          onClick={() => currentStep === 0 ? navigate('/app/linkers') : goToPrevStep()}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous Step'}
        </Button>
      </div>
    </Page>
  );
}
