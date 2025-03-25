import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { createDraftCatalog, updateCatalog, getCatalogById } from '@/services/catalogs';
import { CatalogInfoStep } from '@/components/catalog/CatalogInfoStep';
import { CatalogControlsStep } from '@/components/catalog/CatalogControlsStep';
import { CatalogDashboardStep } from '@/components/catalog/CatalogDashboardStep';

const VITE_NODE_ENV = import.meta.env.VITE_NODE_ENV || 'production';

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

  // Fetch catalog data if editing
  useEffect(() => {
    const fetchCatalog = async () => {
      if (isEditing) {
        try {
          setLoading(true);
          const response = await getCatalogById(id);
          setCatalogData({
            ...response.data,
            controls: response.data.controls || [],
            dashboardConfig: response.data.dashboardConfig || {}
          });
        } catch (err) {
          setError('Failed to load catalog data');
          toast.error('Error loading catalog');
          console.error('Error fetching catalog:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCatalog();
  }, [id, isEditing]);

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
    <Page name={isEditing ? 'Edit Catalog' : 'Create New Catalog'} className="w-full h-full">
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
                      ? 'border-sidebar-accent text-sidebar-accent'
                      : 'border-gray-300 text-gray-300'
                }`}
              >
                {index < currentStep ? (
                  <Check className="w-5 h-5" />
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
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Step content */}
      <Card>
        <CardContent className="pt-6">
          {loading && currentStep === 0 ? (
            <div className="flex justify-center items-center h-60">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            renderStepContent()
          )}
        </CardContent>
      </Card>

      {/* Navigation buttons - Only shown for manually navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => currentStep === 0 ? navigate('/app/catalogs') : goToPrevStep()}
          disabled={loading}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {currentStep === 0 ? 'Cancel' : 'Previous Step'}
        </Button>
        
        {/* This button is just for manual navigation during development */}
        {VITE_NODE_ENV === 'development' && (
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
