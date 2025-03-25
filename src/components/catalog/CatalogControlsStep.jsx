import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, Plus, Trash, Edit, AlertCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { NewControlForm } from '@/forms/control/new/form';
import { getDraftControlsByCatalogId, deleteControl, createDraftControl } from '@/services/controls';
import { createScopeSet } from '@/services/scopes';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function CatalogControlsStep({ initialControls = [], catalogId, onSubmit, isSubmitting, apiError = null }) {
  const [controls, setControls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNewControlForm, setOpenNewControlForm] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [currentControl, setCurrentControl] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  // Load draft controls when component mounts or catalogId changes
  useEffect(() => {
    if (catalogId) {
      fetchDraftControls();
    } else if (initialControls.length > 0) {
      // If no catalogId but initialControls exist, use them
      setControls(initialControls);
    }
  }, [catalogId, initialControls]);

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
      const response = await getDraftControlsByCatalogId(catalogId);
      setControls(response || []);
    } catch (error) {
      console.error('Error fetching draft controls:', error);
      toast.error('Failed to load draft controls');
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
      // Use createDraftControl specifically in the catalog context
      const createdControl = await createDraftControl(data);
      
      // Create the scope set if needed
      if (Object.keys(data.scopes).length > 0) {
        const scopeSetData = {
          controlId: createdControl.id,
          scopes: data.scopes
        };
        
        await createScopeSet(scopeSetData);
      }
      
      return createdControl;
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
          const response = await getDraftControlsByCatalogId(catalogId);
          setControls(response || []);
        } else {
          // If no catalogId, manually add the new control to the current list
          setControls(prevControls => [...prevControls, newControl]);
        }
        toast.success(`Draft control "${newControl.name}" added successfully`);
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
      toast.success('Draft control deleted successfully');
    } catch (error) {
      console.error('Error deleting draft control:', error);
      toast.error('Failed to delete draft control');
    } finally {
      setOpenDialog(false);
      setConfirmingDelete(false);
      setCurrentControl(null);
    }
  };

  const handleSubmit = () => {
    setSubmitError(null);
    
    if (controls.length === 0) {
      setSubmitError('You must add at least one control');
      return;
    }
    
    onSubmit(controls);
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-left">Draft Controls</h2>
        <Button 
          onClick={handleAddControl}
          className="bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent border-2 border-sidebar-accent"
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
        <div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-8 mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <Plus className="h-6 w-6 text-black-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No draft controls yet</h3>
          <p className="text-gray-500 mb-4">Add draft controls to define what to monitor in your catalog</p>
        </div>
      )}

      {/* Controls list with shimmer effect when loading */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {isLoading ? (
          // Shimmer loading effect for controls
          Array(3).fill(0).map((_, index) => (
            <div key={index} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-md"></div>
            </div>
          ))
        ) : controls.length > 0 ? (
          controls.map((control) => (
            <Card key={control.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2 flex flex-row justify-between">
                <div className="text-left">
                  <CardTitle className="text-base font-medium flex items-center">
                    {control.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Period: {control.period}
                  </p>
                </div>
                <div className="flex space-x-1">
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
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteConfirm(control)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm">{control.description}</p>
                
                {/* Añadimos la visualización de scopes con badges */}
                {control.scopes && Object.keys(control.scopes).length > 0 && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(control.scopes).map(([key, value]) => (
                        <Badge key={key} variant="outline">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2 text-xs text-gray-500 grid gap-1">
                  <div>Start Date: {new Date(control.startDate).toLocaleDateString()}</div>
                  {control.endDate && <div>End Date: {new Date(control.endDate).toLocaleDateString()}</div>}
                  {control.mashupId && <div>API Flow ID: {control.mashupId}</div>}
                  {control.params && Object.keys(control.params).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1 items-center">
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
            <p className="text-sm text-gray-500 mt-2">
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
      <div className="flex justify-between items-center mt-8 border-t pt-4">
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
          className="bg-white hover:bg-secondary text-primary min-w-[120px]"
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