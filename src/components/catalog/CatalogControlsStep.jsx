import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Plus, Trash, Edit, AlertCircle, ExternalLink } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NewControlForm } from '@/forms/control/new/form';
import { getControlsByCatalogId, deleteControl, createDraftControl } from '@/services/controls';
import { createScopeSet } from '@/services/scopes';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { getScopeSetsByControlId } from '@/services/scopes';
import { Badge } from '@/components/ui/badge';
import { saveDraftControlId, saveDraftControlIds, saveDraftCatalogId, initializeControlIdsStorage } from '@/utils/draftStorage';
import { dashboardsService } from '@/services/grafana/dashboards';
import { saveDraftDashboardUid } from '@/utils/draftStorage';

export function CatalogControlsStep({ initialControls = [], catalogId, onSubmit, isSubmitting, apiError = null }) {
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNewControlForm, setOpenNewControlForm] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [currentControl, setCurrentControl] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const initialFetchCompleted = useRef(false);

  const nodeRedUrl = import.meta.env.VITE_NODE_RED_URL || 'http://localhost:1880';

  // Save catalogId to localStorage and initialize controls storage
  useEffect(() => {
    // Ensure the control_draft_ids key exists in localStorage
    initializeControlIdsStorage();
    
    if (initialControls && initialControls.length > 0) {
      setControls(initialControls);
      
      // Save control IDs to localStorage
      const controlIds = initialControls.map(control => control.id).filter(Boolean);
      if (controlIds.length > 0) {
        saveDraftControlIds(controlIds);
      }
    }
    else if (catalogId && !initialFetchCompleted.current) {
      saveDraftCatalogId(catalogId);
      fetchDraftControls();
      initialFetchCompleted.current = true;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogId]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  const fetchDraftControls = async () => {
    if (!catalogId) return;
    
    setIsLoading(true);
    try {
      const response = await getControlsByCatalogId(catalogId, 'draft');
      
      // Handle case where the response is empty or undefined
      if (!response || response.length === 0) {
        setControls([]);
        // Save an empty array to localStorage to indicate we've fetched controls (even if empty)
        saveDraftControlIds([]);
        setIsLoading(false);
        return;
      }
      
      const controlsWithScopesData = await Promise.all(
        response.map(async (control) => {
          try {
            const scopeResponse = await getScopeSetsByControlId(control.id);
            return {
              ...control,
              scopes: scopeResponse && scopeResponse.length > 0 
                ? scopeResponse.reduce((acc, scopeSet) => {
                  return { ...acc, ...scopeSet.scopes };
                }, {})
                : {}
            };
          } catch (error) {
            console.error(`Error fetching scopes for control ${control.id}:`, error);
            return { ...control, scopes: {} };
          }
        })
      );
      
      setControls(controlsWithScopesData);
      
      // Save control IDs to localStorage
      const controlIds = controlsWithScopesData.map(control => control.id).filter(Boolean);
      if (controlIds.length > 0) {
        saveDraftControlIds(controlIds);
      } else {
        // Initialize with empty array if no controls
        saveDraftControlIds([]);
      }
    } catch (error) {
      console.error('Error fetching draft controls:', error);
      toast.error('Failed to load draft controls');
      setControls([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddControl = () => {
    setOpenNewControlForm(true);
  };

  const handleCloseNewControlForm = () => {
    setOpenNewControlForm(false);
  };

  const handleCustomSubmit = async (data) => {
    try {
      // Make sure the catalog ID is included in the control data
      if (catalogId) {
        data.catalogId = catalogId;
        // Save catalog ID to localStorage again for safety
        saveDraftCatalogId(catalogId);
        // Ensure control_draft_ids is initialized
        initializeControlIdsStorage();
      }
      
      let scopeSet = { scopes: {} };
      // Use createDraftControl specifically in the catalog context
      const createdControl = await createDraftControl(data);
      
      // Save the new control ID to localStorage
      if (createdControl && createdControl.id) {
        saveDraftControlId(createdControl.id);
      }
      
      // Create the scope set if needed
      if (Object.keys(data.scopes).length > 0) {
        const scopeSetData = {
          controlId: createdControl.id,
          scopes: data.scopes
        };
        
        scopeSet = await createScopeSet(scopeSetData);
      }
      
      return { ...createdControl, scopes: scopeSet.scopes };
    } catch (error) {
      console.error('Error creating draft control:', error);
      throw error;
    }
  };

  const handleControlSuccess = async (newControl) => {
    setOpenNewControlForm(false);
    
    if (newControl && newControl.id) {
      try {
        // Fetch the updated list of controls
        if (catalogId) {
          const response = await getControlsByCatalogId(catalogId, 'draft');
          const controlsWithScopesData = await Promise.all(
            response.map(async (control) => {
              try {
                const scopeResponse = await getScopeSetsByControlId(control.id);
                return {
                  ...control,
                  scopes: scopeResponse.reduce((acc, scopeSet) => {
                    return { ...acc, ...scopeSet.scopes };
                  }, {})
                };
              } catch (error) {
                console.error(`Error fetching scopes for control ${control.id}:`, error);
                return { ...control, scopes: {} };
              }
            })
          );
          setControls(controlsWithScopesData || []);
        } else {
          // If no catalogId, manually add the new control to the current list
          setControls(prevControls => [...prevControls, newControl]);
        }
      } catch (error) {
        console.error('Error updating controls list:', error);
        toast.error('Control was created but the list could not be updated');
        
        // As a fallback, manually add the control to the list
        setControls(prevControls => [...prevControls, newControl]);
      }
    }
  };

  const handleEditControl = (control) => {
    // Placeholder for edit functionality
    toast.info('Edit functionality will be available in a future update');
  };

  const handleDeleteConfirm = (control) => {
    setCurrentControl(control);
    setConfirmingDelete(true);
    setOpenDialog(true);
  };

  const handleDeleteCancel = () => {
    setOpenDialog(false);
    setConfirmingDelete(false);
    setCurrentControl(null);
  };

  const handleDeleteControl = async () => {
    if (!currentControl || !currentControl.id) return;
    
    try {
      await deleteControl(currentControl.id);
      // After deletion, refresh the draft controls list
      await fetchDraftControls();
      toast.success('Control deleted successfully');
    } catch (error) {
      console.error('Error deleting draft control:', error);
      toast.error('Failed to delete draft control');
    } finally {
      setOpenDialog(false);
      setConfirmingDelete(false);
      setCurrentControl(null);
    }
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    
    if (controls.length === 0) {
      setSubmitError('You must add at least one control');
      return;
    }
    
    // Save control IDs and catalog ID to localStorage before submitting
    const controlIds = controls.map(control => control.id).filter(Boolean);
    if (controlIds.length > 0) {
      saveDraftControlIds(controlIds);
    }
    
    if (catalogId) {
      saveDraftCatalogId(catalogId);
    }
    
    try {
      const dashboardName = `tmp-${Date.now()}-${catalogId}`;
      
      // Use the start date of the first control or the current date
      let startDate = 'now-24h';
      if (controls.length > 0 && controls[0].startDate) {
        startDate = new Date(controls[0].startDate).toISOString();
      }
      
      // Create the template dashboard
      const dashboardResponse = await dashboardsService.createTemplate({
        name: dashboardName,
        timeRange: {
          from: startDate,
          to: 'now'
        }
      });

      // Store the dashboard UID in localStorage
      if (dashboardResponse?.dashboard && dashboardResponse.dashboard?.uid) {
        const dashboardUid = dashboardResponse?.dashboard?.uid;
        saveDraftDashboardUid(dashboardUid);
      }
    } catch (error) {
      console.error('Error creating template dashboard:', error);
      toast.warning('Could not create template dashboard, panels may not display correctly');
    }
    
    onSubmit(controls);
  };

  return (
    <div className="py-4">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-left text-xl font-semibold">Draft Controls</h2>
        <Button 
          onClick={handleAddControl}
          className="border-2 border-sidebar-accent bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Draft Control
        </Button>
      </div>

      {submitError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {typeof submitError === 'string' 
              ? submitError 
              : 'There was an error saving your data. Please try again.'}
          </AlertDescription>
        </Alert>
      )}

      {/* Empty state with helpful message */}
      {!isLoading && controls.length === 0 && (
        <div className="mb-6 border border-gray-300 rounded-lg border-dashed bg-gray-50 p-8 text-center">
          <h3 className="mb-1 text-lg text-gray-900 font-medium">No draft controls yet</h3>
          <p className="mb-4 text-gray-500">Add draft controls to define what to monitor in your catalog</p>
        </div>
      )}

      {/* Controls list with shimmer effect when loading */}
      <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
        {isLoading ? (
          // Shimmer loading effect for controls
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-24 rounded-md bg-gray-200"></div>
            </div>
          ))
        ) : controls.length > 0 ? (
          controls.map((control) => (
            <Card key={control.id} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row justify-between p-4 pb-2">
                <div className="text-left">
                  <CardTitle className="flex items-center text-base font-medium">
                    {control.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Period: {control.period}
                  </p>
                </div>
                <div className="flex space-x-1">
                  {control.mashupId && (
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => window.open(`${nodeRedUrl}/#flow/${control.mashupId}`, '_blank')}>
                        <ExternalLink className="mr-2 h-4 w-4" /> View mashup
                      </Button>
                    </div>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditControl(control)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleDeleteConfirm(control)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm">{control.description}</p>
                
                
                
                <div className="grid mt-2 gap-1 text-xs text-gray-500">
                  
                  <div className='flex'>Start Date: {new Date(control.startDate).toLocaleDateString()}</div>
                  {control.endDate && <div className='flex'>End Date: {new Date(control.endDate).toLocaleDateString()}</div>}
                  {control.scopes && Object.keys(control.scopes).length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span>Scopes: </span>
                      {Object.entries(control.scopes).map(([key, value]) => (
                        <Badge key={key} variant="outline">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  )}  
                  {control.params && Object.keys(control.params).length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span>Parameters: </span>
                      {Object.entries(control.params).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        ) : null}
      </div>

      {/* Draft Control Form - Pass customSubmit for draft control creation */}
      {openNewControlForm && (
        <NewControlForm 
          catalogId={catalogId}
          onClose={handleCloseNewControlForm}
          onSuccess={handleControlSuccess}
          customSubmit={handleCustomSubmit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog && confirmingDelete} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Draft Control</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete this draft control?</p>
            <p className="mt-2 text-sm text-gray-500">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleDeleteCancel}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteControl}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Progress counter and Navigation button */}
      <div className="mt-8 flex items-center justify-between border-t pt-4">
        <div className="text-sm text-gray-500">
          {controls.length > 0 ? (
            <span>{controls.length} draft control{controls.length !== 1 ? 's' : ''} added</span>
          ) : (
            <span>Add at least one draft control to continue</span>
          )}
        </div>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting || controls.length === 0}
          className="min-w-[120px] bg-white text-primary hover:bg-secondary"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              Next Step
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}