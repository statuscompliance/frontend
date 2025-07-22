import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Check, AlertCircle, Trash } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { AddPanelForm } from '@/forms/dashboard/panel/form';
import { dashboardsService } from '@/services/grafana/dashboards';
import { Badge } from '@/components/ui/badge';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import { getDraftDashboardUid, clearDraftDashboardUid } from '@/utils/draftStorage';

// Dashboard configuration schema
const dashboardConfigSchema = z.object({
  title: z.string().min(1, { message: 'Dashboard title is required' }),
  description: z.string().optional(),
  panels: z.array(
    z.object({
      title: z.string().min(1, { message: 'Panel title is required' }),
      type: z.string(),
      controlId: z.string().optional(),
      panelId: z.number().optional(),
      position: z.object({
        x: z.number(),
        y: z.number(),
        w: z.number(),
        h: z.number(),
      }),
      originalPanel: z.any().optional(),
    })
  ).optional(),
  showSummaryStats: z.boolean().default(true),
});

export function CatalogDashboardStep({ initialConfig = {}, controls = [], catalogId, onSubmit, isSubmitting, apiError = null }) {
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [showAddPanelForm, setShowAddPanelForm] = useState(false);
  const [tempDashboardUid, setTempDashboardUid] = useState(null);
  const [isRemovingPanel, setIsRemovingPanel] = useState(false);
  
  // Setup form with zod resolver
  const form = useForm({
    resolver: zodResolver(dashboardConfigSchema),
    defaultValues: {
      title: '',
      description: initialConfig.description || '',
      panels: initialConfig.panels || [],
      showSummaryStats: true,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'panels',
  });

  // Try to load dashboard UID from localStorage
  useEffect(() => {
    const draftDashboardUid = getDraftDashboardUid();
    if (draftDashboardUid) {
      setTempDashboardUid(draftDashboardUid);
      
      // Load existing panels from the dashboard
      if (fields.length === 0) {
        loadDashboardPanels(draftDashboardUid);
      }
    } else {
      toast.error('No dashboard template found. Please go back to the Controls step.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields.length]);

  // Function to load existing panels from the dashboard
  const loadDashboardPanels = async (dashboardUid) => {
    try {
      const response = await dashboardsService.getPanels(dashboardUid);
      const panels = Array.isArray(response) ? response : (response.data || []);
      
      if (panels.length > 0) {
        const formattedPanels = panels.map(panel => ({
          title: panel.title,
          type: panel.type,
          controlId: panel.controlId || '',
          position: panel.gridPos || { x: 0, y: 0, w: 6, h: 4 },
          panelId: panel.id,
          originalPanel: panel
        }));
        
        form.setValue('panels', formattedPanels);
      }
    } catch (error) {
      console.error('Error loading dashboard panels:', error);
    }
  };

  // Update form values when initialConfig changes
  useEffect(() => {
    if (initialConfig && Object.keys(initialConfig).length > 0) {
      form.reset({
        title: initialConfig.title || '',
        description: initialConfig.description || '',
        panels: initialConfig.panels || [],
        showSummaryStats: true,
      });
    }
  }, [initialConfig, catalogId, form]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Dashboard is not deleted here as it may be used elsewhere
    };
  }, []);

  const handleOpenAddPanel = async () => {
    try {
      // Check if we have a dashboard UID
      if (!tempDashboardUid) {
        const draftUid = getDraftDashboardUid();
        if (draftUid) {
          setTempDashboardUid(draftUid);
        } else {
          toast.error('No dashboard template available. Please go back to the Controls step.');
          return;
        }
      }
      setShowAddPanelForm(true);
    } catch (error) {
      console.error('Error preparing panel form:', error);
      toast.error('Failed to initialize panel form');
    }
  };

  const handlePanelAdded = (panelData) => {
    // Add the new panel directly
    const newPanel = {
      title: panelData.title,
      type: panelData.type,
      controlId: panelData.controlId && panelData.controlId !== 'none' ? panelData.controlId : '',
      position: panelData.gridPos || {
        x: 0,
        y: 0,
        w: 6,
        h: 4
      },
      panelId: panelData.id || panelData.panelId,
      originalPanel: panelData
    };
    
    append(newPanel);
    setSelectedPanel(fields.length);
    setShowAddPanelForm(false);
    toast.success('Panel added to dashboard');
    
    if (tempDashboardUid) {
      loadDashboardPanels(tempDashboardUid);
    }
  };

  const handlePanelRemoved = (panelId) => {
    console.log('Panel removed from form:', panelId);
  };

  const handleDeletePanel = async (index, panelId) => {
    try {
      setIsRemovingPanel(true);
      
      // Remove the panel from Grafana if a dashboard and panel ID exist
      if (tempDashboardUid && panelId) {
        await dashboardsService.removePanel(tempDashboardUid, panelId);
        toast.success('Panel removed from dashboard');
      }
      
      // Remove the panel from the form
      remove(index);
      setSelectedPanel(null);
    } catch (error) {
      console.error('Error removing panel:', error);
      toast.error('Failed to remove panel');
    } finally {
      setIsRemovingPanel(false);
    }
  };

  const handleSubmit = (data) => {
    setSubmitError(null);
    
    // Clear dashboard UID from localStorage when finished
    clearDraftDashboardUid();
    
    onSubmit(data);
  };

  return (
    <div className="py-4">
      {/* Error alert */}
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
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="text-left space-y-6">
          {/* Dashboard title and description fields */}
          <div className="grid grid-cols-1 gap-6">
            <div>
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dashboard Title <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter dashboard title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter dashboard description" 
                    rows={2}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="border-t pt-6">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-lg font-medium">Panels</h4>
              <div className="flex gap-2">
                {tempDashboardUid && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const grafanaUrl = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';
                      window.open(`${grafanaUrl}/d/${tempDashboardUid}`, '_blank');
                    }}
                  >
                    View Dashboard
                  </Button>
                )}
                <Button 
                  type="button" 
                  onClick={handleOpenAddPanel}
                  variant="destructive"
                  disabled={!tempDashboardUid}
                >
                  Add Panel
                </Button>
              </div>
            </div>

            {fields.length > 0 ? (
              <Tabs 
                value={selectedPanel !== null ? selectedPanel.toString() : undefined}
                onValueChange={(value) => setSelectedPanel(parseInt(value))}
                className="mt-2"
              >
                {/* Panel tabs */}
                <TabsList className="mb-4">
                  {fields.map((panel, index) => (
                    <TabsTrigger key={panel.id} value={index.toString()}>
                      {panel.title || `Panel ${index + 1}`}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {fields.map((panel, index) => (
                  <TabsContent key={panel.id} value={index.toString()} className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{panel.title}</CardTitle>
                          <Badge variant="outline">{panel.type}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {panel.panelId && tempDashboardUid && (
                          <div>
                            <FormLabel>Preview</FormLabel>
                            <div className="mt-2 h-[200px]">
                              <DashboardPanel 
                                dashboardUid={tempDashboardUid}
                                panel={{...panel.originalPanel, id: panel.panelId}}
                                height={180}
                                timeRange={{ from: 'now-24h', to: 'now' }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                      {/* <CardFooter className="flex justify-between">
                        <Button 
                          type="button" 
                          variant="destructive"
                          onClick={() => handleDeletePanel(index, panel.panelId)}
                          disabled={isRemovingPanel}
                        >
                          {isRemovingPanel ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Trash className="mr-2 h-4 w-4" />
                          )}
                          Remove Panel
                        </Button>
                      </CardFooter> */}
                    </Card>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="border rounded-md bg-gray-50 py-10 text-center">
                <p className="text-gray-500">No panels added yet. Click &quot;Add Panel&quot; to start building your dashboard.</p>
              </div>
            )}
          </div>

          {/* Submit button */}
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px]"
              variant="outline"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Complete
                  <Check className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Form>

      {/* Panel Form */}
      {showAddPanelForm && tempDashboardUid && (
        <AddPanelForm
          dashboardUid={tempDashboardUid}
          onClose={() => setShowAddPanelForm(false)}
          onSuccess={handlePanelAdded}
          dashboardTimeRange={{ from: 'now-24h', to: 'now' }}
          existingDashboard={true}
          onPanelRemoved={handlePanelRemoved}
        />
      )}
    </div>
  );
}
