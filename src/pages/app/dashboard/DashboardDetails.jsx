import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardsService } from '@/services/grafana/dashboards';
import { toast } from 'sonner';
import Page from '@/components/basic-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash, Calendar, User, Bookmark, Clock, ExternalLink } from 'lucide-react';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';

const GRAFANA_URL = import.meta.env.VITE_GRAFANA_URL || 'http://localhost:3100';

export function DashboardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardsService.getById(id);
        setDashboard(response);
        
        if (response?.dashboard?.panels && response.dashboard.panels.length > 0) {
          setPanels(response.dashboard.panels);
        } else {
          const panelsResponse = await dashboardsService.getPanels(id);
          console.log('panelsResponse', panelsResponse);
          setPanels(panelsResponse.data || panelsResponse || []);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error loading dashboard:', err);
        setError('Failed to load dashboard details');
        toast.error('Error loading dashboard details');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this dashboard?')) {
      try {
        await dashboardsService.delete(id);
        toast.success('Dashboard deleted successfully');
        navigate('/app/dashboards');
      } catch (err) {
        console.error('Error deleting dashboard:', err);
        toast.error('Failed to delete dashboard');
      }
    }
  };

  const handleBack = () => {
    navigate('/app/dashboards');
  };

  if (loading) {
    return (
      <Page>
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </Page>
    );
  }

  if (error || !dashboard) {
    return (
      <Page>
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error || "Couldn't load dashboard details"}. <Button variant="link" onClick={handleBack}>Go back</Button>
          </AlertDescription>
        </Alert>
      </Page>
    );
  }

  const { dashboard: dashboardData, meta } = dashboard;
  const title = dashboardData?.title || dashboard.title || 'Untitled Dashboard';
  const description = dashboardData?.description || dashboard.description || '';
  const uid = dashboardData?.uid || dashboard.uid || '';
  const version = dashboardData?.version || dashboard.version || '';
  const tags = dashboardData?.tags || dashboard.tags || [];
  const folderTitle = meta?.folderTitle || 'General';
  const created = meta?.created ? new Date(meta.created) : null;
  const updated = meta?.updated ? new Date(meta.updated) : null;
  const createdBy = meta?.createdBy || '';
  const updatedBy = meta?.updatedBy || '';
  const isEditable = dashboardData?.editable || false;
  const url = meta?.url || '';
  const timeRange = dashboardData?.time || dashboard.time || { from: '', to: '' };
  
  const externalGrafanaUrl = url ? `${GRAFANA_URL}${url}` : '';

  return (
    <Page dashboard={dashboardData}>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{title}</h1>
            {description && <p className="text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex space-x-2">
          {isEditable && (
            <Button variant="outline" onClick={() => navigate(`/app/dashboards/edit/${id}`)}>
              <Edit className="h-4 w-4 mr-2" /> Edit
            </Button>
          )}
          {meta?.canDelete && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-96 justify-center bg-secondary">
          <TabsTrigger className="bg-secondary" value="overview">Overview</TabsTrigger>
          <TabsTrigger className="bg-secondary" value="panels">Panels ({panels.length})</TabsTrigger>
          <TabsTrigger className="bg-secondary" value="metadata">Metadata</TabsTrigger>
          <TabsTrigger className="bg-secondary" value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Dashboard Details</h3>
                    <dl className="grid grid-cols-1 gap-2 text-left">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Title</dt>
                        <dd className="text-base">{title}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">UID</dt>
                        <dd className="text-base">{uid}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Folder</dt>
                        <dd className="text-base flex items-center">
                          <Bookmark className="h-3 w-3 mr-1" /> 
                          {folderTitle}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Version</dt>
                        <dd className="text-base">{version}</dd>
                      </div>
                    </dl>
                  </div>

                  {tags.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">Tags</h3>
                      <div className="flex flex-wrap gap-1">
                        {tags.map(tag => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {timeRange && (timeRange.from || timeRange.to) && (
                    <div>
                      <h3 className="text-sm font-medium text-muted-foreground mb-1">Default Time Range</h3>
                      <div className="flex items-center text-sm">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>
                          {timeRange.from && new Date(timeRange.from).toLocaleString()} – 
                          {timeRange.to && new Date(timeRange.to).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">General Settings</h3>
                    <dl className="grid grid-cols-1 gap-2 text-left">
                      {dashboard.dashboard?.timezone && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Timezone</dt>
                          <dd className="text-base">{dashboard.dashboard.timezone}</dd>
                        </div>
                      )}
                      {dashboard.dashboard?.refresh !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Auto Refresh</dt>
                          <dd className="text-base">{dashboard.dashboard.refresh || 'Off'}</dd>
                        </div>
                      )}
                      {dashboard.dashboard?.graphTooltip !== undefined && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Graph Tooltip</dt>
                          <dd className="text-base">{dashboard.dashboard.graphTooltip}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>
            </CardContent>
            {externalGrafanaUrl && (
              <CardFooter className="border-t pt-4">
                <Button variant="outline" size="sm" onClick={() => window.open(externalGrafanaUrl, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" /> View in Grafana
                </Button>
              </CardFooter>
            )}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {panels.slice(0, 6).map(panel => (
              <Card key={panel.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <DashboardPanel 
                    dashboardUid={uid} 
                    panel={panel} 
                    height={200}
                  />
                </CardContent>
                <CardFooter className="p-4">
                  <CardDescription className="text-xs">
                    {panel.type && (
                      <Badge variant="outline" className="mr-2">
                        {panel.type}
                      </Badge>
                    )}
                    {panel.id && `Panel ID: ${panel.id}`}
                  </CardDescription>
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="panels" className="mt-6">
          <div className="space-y-6">
            {panels.length === 0 ? (
              <Alert>
                <AlertTitle>No panels found</AlertTitle>
                <AlertDescription>This dashboard doesn&apos;t contain any panels yet.</AlertDescription>
              </Alert>
            ) : (
              panels.map(panel => (
                <Card key={panel.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        {panel.description && <CardDescription>{panel.description}</CardDescription>}
                      </div>
                      <Badge variant="outline">{panel.type}</Badge>
                    </div>
                    {panel.rawSql && (
                      <div className="mt-2">
                        <h4 className="text-sm font-medium text-muted-foreground mb-1">SQL Query</h4>
                        <pre className="bg-muted p-2 rounded-md text-xs overflow-auto">{panel.rawSql}</pre>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <DashboardPanel 
                      dashboardUid={uid} 
                      panel={panel} 
                      height={300}
                    />
                  </CardContent>
                  <CardFooter className="text-xs text-muted-foreground border-t p-2">
                    <div className="flex justify-between w-full">
                      <span>Panel ID: {panel.id}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="metadata" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Metadata</CardTitle>
              <CardDescription>Technical details about this dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Dashboard JSON Model</h3>
                    <dl className="grid grid-cols-1 gap-2 text-left">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Schema Version</dt>
                        <dd className="text-base">{dashboardData?.schemaVersion || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Dashboard ID</dt>
                        <dd className="text-base">{dashboardData?.id || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Version</dt>
                        <dd className="text-base">{version || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Iteration</dt>
                        <dd className="text-base">{dashboardData?.iteration || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">API Information</h3>
                    <dl className="grid grid-cols-1 gap-2 text-left">
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Provider Name</dt>
                        <dd className="text-base">{meta?.provisionedBy || 'Manual'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">Folder ID</dt>
                        <dd className="text-base">{meta?.folderId !== undefined ? meta.folderId : 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">URL Slug</dt>
                        <dd className="text-base">{meta?.slug || 'N/A'}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-muted-foreground">UUID</dt>
                        <dd className="text-base font-mono text-xs">{uid || 'N/A'}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Creation Information</h3>
                    <dl className="grid grid-cols-1 gap-2 text-left">
                      {created && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Created</dt>
                          <dd className="text-base flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{created.toLocaleDateString()}</span>
                            {createdBy && (
                              <>
                                <span className="text-muted-foreground mx-1">by</span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" /> {createdBy}
                                </span>
                              </>
                            )}
                          </dd>
                        </div>
                      )}
                      
                      {updated && (
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Last updated</dt>
                          <dd className="text-base flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{updated.toLocaleDateString()}</span>
                            <span className="text-muted-foreground text-xs">({formatDistanceToNow(updated, { addSuffix: true })})</span>
                            {updatedBy && (
                              <>
                                <span className="text-muted-foreground mx-1">by</span>
                                <span className="flex items-center">
                                  <User className="h-3 w-3 mr-1" /> {updatedBy}
                                </span>
                              </>
                            )}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Permissions</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm text-left">
                      <div className="flex items-center">
                        <span className="mr-2">Editable:</span>
                        <Badge variant={isEditable ? 'default' : 'outline'}>
                          {isEditable ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">Can Admin:</span>
                        <Badge variant={meta?.canAdmin ? 'default' : 'outline'}>
                          {meta?.canAdmin ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">Can Edit:</span>
                        <Badge variant={meta?.canEdit ? 'default' : 'outline'}>
                          {meta?.canEdit ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">Can Delete:</span>
                        <Badge variant={meta?.canDelete ? 'default' : 'outline'}>
                          {meta?.canDelete ? 'Yes' : 'No'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Additional Properties</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-2 text-left">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Timezone</dt>
                    <dd className="text-base">{dashboardData?.timezone || 'browser'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Refresh Rate</dt>
                    <dd className="text-base">{dashboardData?.refresh || 'Off'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Graph Tooltip</dt>
                    <dd className="text-base">{dashboardData?.graphTooltip !== undefined ? dashboardData.graphTooltip : 'Default'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Time Picker Visible</dt>
                    <dd className="text-base">{dashboardData?.timepicker?.hidden === true ? 'No' : 'Yes'}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard Settings</CardTitle>
              <CardDescription>Configure dashboard options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Dashboard Properties</h3>
                <Separator className="my-2" />
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  {dashboard.dashboard?.graphTooltip !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Graph Tooltip</dt>
                      <dd className="text-base">{dashboard.dashboard.graphTooltip}</dd>
                    </div>
                  )}
                  {dashboard.dashboard?.timezone && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Timezone</dt>
                      <dd className="text-base">{dashboard.dashboard.timezone}</dd>
                    </div>
                  )}
                  {dashboard.dashboard?.schemaVersion && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Schema Version</dt>
                      <dd className="text-base">{dashboard.dashboard.schemaVersion}</dd>
                    </div>
                  )}
                  {dashboard.dashboard?.refresh !== undefined && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Auto Refresh</dt>
                      <dd className="text-base">{dashboard.dashboard.refresh || 'Off'}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}

export default DashboardDetails;
