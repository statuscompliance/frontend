import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dashboardsService } from '@/services/grafana/dashboards';
import { toast } from 'sonner';
import Page from '@/components/basic-page';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash, Calendar, User, Bookmark, Clock, ExternalLink, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { DashboardPanel } from '@/components/dashboard/dashboard-panel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { parseTimeRange } from '@/utils/timeRangeParser';
import { useAuth } from '@/hooks/use-auth';
import { GRAFANA_BASE_URL } from '@/api/grafanaClient';

export function DashboardDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [panels, setPanels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { userData } = useAuth();
  const [showDashboardInfo, setShowDashboardInfo] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardsService.getById(id);
        setDashboard(response);
        
        if (response?.dashboard?.panels && response.dashboard.panels.length > 0) {
          setPanels(response.dashboard.panels);
        } else {
          setPanels([]);
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
        <div className="mb-6 flex items-center">
          <Button variant="ghost" onClick={handleBack} className="mr-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
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
  
  const parsedTimeRange = {
    from: isNaN(new Date(timeRange.from).getTime()) ? parseTimeRange(timeRange).from : timeRange.from,
    to: isNaN(new Date(timeRange.to).getTime()) ? parseTimeRange(timeRange).to : timeRange.to
  };
  
  const externalGrafanaUrl = url ? `${GRAFANA_BASE_URL}${url}` : '';

  return (
    <Page dashboard={dashboardData}>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex items-center justify-between"> 
            <Button variant="ghost" onClick={handleBack} className="mr-4">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <h3 className="text-2xl font-bold">{title}</h3>
            {userData.authority === 'USER' && timeRange && (timeRange.from || timeRange.to) && (
              <CardDescription className="mx-4 flex items-center">
                <Clock className="mr-1 h-3 w-3" />
                <span>
                  {new Date(parsedTimeRange.from).toLocaleString()} - {new Date(parsedTimeRange.to).toLocaleString()}
                </span>
              </CardDescription>
            )}
          </div>
          {userData.authority === 'USER' && externalGrafanaUrl && (
            <Button variant="outline" size="sm" onClick={() => window.open(externalGrafanaUrl, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" /> View in Grafana
            </Button>
          )}
        </div>
        <div className="flex space-x-2">
          {isEditable && userData.authority !== 'USER' && (
            <Button variant="outline" onClick={() => navigate(`/app/dashboards/edit/${id}`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {meta?.canDelete && userData.authority !== 'USER' && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      {userData.authority === 'USER' ? (
        <div className="space-y-6">

          {/* Panel content */}
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
                    {panel.rawSql && userData.authority !== 'USER' && (
                      <div className="mt-2">
                        <h4 className="mb-1 text-sm text-muted-foreground font-medium">SQL Query</h4>
                        <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{panel.rawSql}</pre>
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
                  <CardFooter className="border-t p-2 text-xs text-muted-foreground">
                    <div className="w-full flex justify-between">
                      <span>Panel ID: {panel.id}</span>
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-96 justify-center bg-secondary">
            <TabsTrigger className="bg-secondary" value="overview">Overview</TabsTrigger>
            <TabsTrigger className="bg-secondary" value="panels">Panels ({panels.length})</TabsTrigger>
            <TabsTrigger className="bg-secondary" value="metadata">Metadata</TabsTrigger>
            <TabsTrigger className="bg-secondary" value="settings">Settings</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-6 space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-t pt-4">
                <div className="flex items-end">
                  {externalGrafanaUrl && (
                    <Button className="w-44" variant="outline" size="sm" onClick={() => window.open(externalGrafanaUrl, '_blank')}>
                      <ExternalLink className="mr-2 h-4 w-4" /> View in Grafana
                    </Button>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowDashboardInfo(!showDashboardInfo)}
                  className="flex items-center"
                >
                  <Info className="mr-1 h-4 w-4" /> 
                  {showDashboardInfo ? 'Hide Details' : 'More Info'}
                  {showDashboardInfo ? (
                    <ChevronUp className="ml-1 h-4 w-4" />
                  ) : (
                    <ChevronDown className="ml-1 h-4 w-4" />
                  )}
                </Button>
              </CardHeader>
              {showDashboardInfo && (
                <CardContent className="px-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {/* Rest of overview card content */}
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-1 text-sm text-muted-foreground font-medium">Dashboard Details</h3>
                        <dl className="grid grid-cols-1 gap-2 text-left">
                          <div>
                            <dt className="text-sm text-muted-foreground font-medium">Folder</dt>
                            <dd className="flex items-center text-sm">
                              <Bookmark className="mr-1 h-3 w-3" /> 
                              {folderTitle}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm text-muted-foreground font-medium">Version</dt>
                            <dd className="text-sm">{version}</dd>
                          </div>
                        </dl>
                      </div>

                      {tags.length > 0 && (
                        <div>
                          <h3 className="mb-2 text-sm text-muted-foreground font-medium">Tags</h3>
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
                          <h3 className="mb-1 text-sm text-muted-foreground font-medium">Default Time Range</h3>
                          <div className="flex items-center justify-center text-sm">
                            <Clock className="mr-1 h-3 w-3" />
                            <span>
                              {new Date(parsedTimeRange.from).toLocaleString()
                              } - {new Date(parsedTimeRange.to).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-1 text-sm text-muted-foreground font-medium">General Settings</h3>
                        <dl className="grid grid-cols-1 gap-2 text-left">
                          {dashboard.dashboard?.timezone && (
                            <div>
                              <dt className="text-sm text-muted-foreground font-medium">Timezone</dt>
                              <dd className="text-sm">{dashboard.dashboard.timezone}</dd>
                            </div>
                          )}
                          {dashboard.dashboard?.refresh !== undefined && (
                            <div>
                              <dt className="text-sm text-muted-foreground font-medium">Auto Refresh</dt>
                              <dd className="text-sm">{dashboard.dashboard.refresh || 'Off'}</dd>
                            </div>
                          )}
                          {dashboard.dashboard?.graphTooltip !== undefined && (
                            <div>
                              <dt className="text-sm text-muted-foreground font-medium">Graph Tooltip</dt>
                              <dd className="text-sm">{dashboard.dashboard.graphTooltip}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 md:grid-cols-2">
              {/* Panel preview grid */}
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
          
          {/* Rest of tab contents */}
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
                          <h4 className="mb-1 text-sm text-muted-foreground font-medium">SQL Query</h4>
                          <pre className="overflow-auto rounded-md bg-muted p-2 text-xs">{panel.rawSql}</pre>
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
                    <CardFooter className="border-t p-2 text-xs text-muted-foreground">
                      <div className="w-full flex justify-between">
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
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-1 text-sm text-muted-foreground font-medium">Dashboard JSON Model</h3>
                      <dl className="grid grid-cols-1 gap-2 text-left">
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Schema Version</dt>
                          <dd className="text-base">{dashboardData?.schemaVersion || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Dashboard ID</dt>
                          <dd className="text-base">{dashboardData?.id || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Version</dt>
                          <dd className="text-base">{version || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Iteration</dt>
                          <dd className="text-base">{dashboardData?.iteration || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-1 text-sm text-muted-foreground font-medium">API Information</h3>
                      <dl className="grid grid-cols-1 gap-2 text-left">
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Provider Name</dt>
                          <dd className="text-base">{meta?.provisionedBy || 'Manual'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">Folder ID</dt>
                          <dd className="text-base">{meta?.folderId !== undefined ? meta.folderId : 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">URL Slug</dt>
                          <dd className="text-base">{meta?.slug || 'N/A'}</dd>
                        </div>
                        <div>
                          <dt className="text-sm text-muted-foreground font-medium">UUID</dt>
                          <dd className="text-base text-xs font-mono">{uid || 'N/A'}</dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-1 text-sm text-muted-foreground font-medium">Creation Information</h3>
                      <dl className="grid grid-cols-1 gap-2 text-left">
                        {created && (
                          <div>
                            <dt className="text-sm text-muted-foreground font-medium">Created</dt>
                            <dd className="flex items-center gap-1 text-base">
                              <Calendar className="h-3 w-3" />
                              <span>{created.toLocaleDateString()}</span>
                              {createdBy && (
                                <>
                                  <span className="mx-1 text-muted-foreground">by</span>
                                  <span className="flex items-center">
                                    <User className="mr-1 h-3 w-3" /> {createdBy}
                                  </span>
                                </>
                              )}
                            </dd>
                          </div>
                        )}
                        
                        {updated && (
                          <div>
                            <dt className="text-sm text-muted-foreground font-medium">Last updated</dt>
                            <dd className="flex items-center gap-1 text-base">
                              <Calendar className="h-3 w-3" />
                              <span>{updated.toLocaleDateString()}</span>
                              <span className="text-xs text-muted-foreground">({formatDistanceToNow(updated, { addSuffix: true })})</span>
                              {updatedBy && (
                                <>
                                  <span className="mx-1 text-muted-foreground">by</span>
                                  <span className="flex items-center">
                                    <User className="mr-1 h-3 w-3" /> {updatedBy}
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
                      <h3 className="mb-1 text-sm text-muted-foreground font-medium">Permissions</h3>
                      <div className="grid grid-cols-2 gap-2 text-left text-sm">
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
                  <h3 className="mb-1 text-sm text-muted-foreground font-medium">Additional Properties</h3>
                  <dl className="grid grid-cols-1 gap-2 text-left md:grid-cols-2">
                    <div>
                      <dt className="text-sm text-muted-foreground font-medium">Timezone</dt>
                      <dd className="text-base">{dashboardData?.timezone || 'browser'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground font-medium">Refresh Rate</dt>
                      <dd className="text-base">{dashboardData?.refresh || 'Off'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground font-medium">Graph Tooltip</dt>
                      <dd className="text-base">{dashboardData?.graphTooltip !== undefined ? dashboardData.graphTooltip : 'Default'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground font-medium">Time Picker Visible</dt>
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
                  <dl className="grid grid-cols-1 gap-4 text-left md:grid-cols-2">
                    {dashboard.dashboard?.graphTooltip !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground font-medium">Graph Tooltip</dt>
                        <dd className="text-base">{dashboard.dashboard.graphTooltip}</dd>
                      </div>
                    )}
                    {dashboard.dashboard?.timezone && (
                      <div>
                        <dt className="text-sm text-muted-foreground font-medium">Timezone</dt>
                        <dd className="text-base">{dashboard.dashboard.timezone}</dd>
                      </div>
                    )}
                    {dashboard.dashboard?.schemaVersion && (
                      <div>
                        <dt className="text-sm text-muted-foreground font-medium">Schema Version</dt>
                        <dd className="text-base">{dashboard.dashboard.schemaVersion}</dd>
                      </div>
                    )}
                    {dashboard.dashboard?.refresh !== undefined && (
                      <div>
                        <dt className="text-sm text-muted-foreground font-medium">Auto Refresh</dt>
                        <dd className="text-base">{dashboard.dashboard.refresh || 'Off'}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </Page>
  );
}

export default DashboardDetails;
