import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Edit, PlayCircle, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Page from '@/components/basic-page';
import { getLinkerById, executeLinker } from '@/services/linkers';
import { getAllDatasources } from '@/services/datasources';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function LinkerDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [linker, setLinker] = useState(null);
  const [datasources, setDatasources] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [linkerData, datasourcesData] = await Promise.all([
          getLinkerById(id),
          getAllDatasources()
        ]);
        setLinker(linkerData);
        setDatasources(datasourcesData);
      } catch (err) {
        console.error('Error loading linker:', err);
        toast.error('Failed to load linker details');
        navigate('/app/linkers');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, navigate]);

  const handleExecute = async () => {
    try {
      setExecuting(true);
      await executeLinker(id);
      toast.success('Linker executed successfully');
      // Reload linker data to get updated execution status
      const updatedLinker = await getLinkerById(id);
      setLinker(updatedLinker);
    } catch (err) {
      console.error('Error executing linker:', err);
      toast.error('Failed to execute linker');
    } finally {
      setExecuting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDatasourceName = (id) => {
    const datasource = datasources.find(ds => ds.id === id);
    return datasource?.name || id;
  };

  const getDatasourceTypeLabel = (id) => {
    const datasource = datasources.find(ds => ds.id === id);
    if (!datasource) return '-';
    
    const typeMap = {
      'rest-api': 'REST API',
      'microsoft-graph': 'Microsoft Graph',
      'owncloud': 'OwnCloud'
    };
    
    return typeMap[datasource.definitionId] || datasource.definitionId;
  };

  const getExecutionStatusBadge = (status) => {
    switch (status) {
    case 'success':
      return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="mr-1 h-3 w-3" />Success</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
    case 'error':
      return <Badge className="bg-red-100 text-red-800"><AlertCircle className="mr-1 h-3 w-3" />Error</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getCacheStatusBadge = (status) => {
    switch (status) {
    case 'valid':
      return <Badge className="bg-green-100 text-green-800">Valid</Badge>;
    case 'expired':
      return <Badge className="bg-yellow-100 text-yellow-800">Expired</Badge>;
    case 'invalid':
      return <Badge className="bg-red-100 text-red-800">Invalid</Badge>;
    default:
      return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const renderDatasourcesList = () => {
    if (!linker?.datasourceIds || linker.datasourceIds.length === 0) {
      return (
        <div className="border rounded-md py-8 text-center text-gray-500">
          No datasources configured
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {linker.datasourceIds.map((dsId) => {
          const datasource = datasources.find(ds => ds.id === dsId);
          return (
            <div 
              key={dsId} 
              className="cursor-pointer border rounded-md p-4 transition-colors hover:bg-gray-50"
              onClick={() => navigate(`/app/datasources/${dsId}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{getDatasourceName(dsId)}</h4>
                    {datasource?.environment && (
                      <Badge variant="outline" className="text-xs">
                        {datasource.environment}
                      </Badge>
                    )}
                    {datasource?.isActive && (
                      <Badge className="bg-green-100 text-xs text-green-800">Active</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-600">
                    {getDatasourceTypeLabel(dsId)}
                  </p>
                  {datasource?.description && (
                    <p className="line-clamp-2 mt-2 text-sm text-gray-500">
                      {datasource.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderExecutionDetails = () => {
    if (!linker) return null;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Execution Information</h3>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <Label className="mb-1 block text-sm text-gray-500 font-medium">
              Execution Status
            </Label>
            <div className="text-base">
              {getExecutionStatusBadge(linker.executionStatus)}
            </div>
          </div>
          
          <div>
            <Label className="mb-1 block text-sm text-gray-500 font-medium">
              Cache Status
            </Label>
            <div className="text-base">
              {getCacheStatusBadge(linker.cacheStatus)}
            </div>
          </div>
          
          <div>
            <Label className="mb-1 block text-sm text-gray-500 font-medium">
              Last Executed
            </Label>
            <p className="text-base">
              {formatDate(linker.lastExecutedAt)}
            </p>
          </div>
          
          <div>
            <Label className="mb-1 block text-sm text-gray-500 font-medium">
              Cache Expires
            </Label>
            <p className="text-base">
              {formatDate(linker.cacheExpiresAt)}
            </p>
          </div>
        </div>

        {userData.authority !== 'USER' && (
          <div className="mt-6">
            <Button
              type="button"
              onClick={handleExecute}
              disabled={executing}
              className="w-full"
            >
              {executing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 h-4 w-4" />
                  Execute Linker
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <Page name="Linker Details" className="container mx-auto p-4">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" />
          <span>Loading linker details...</span>
        </div>
      </Page>
    );
  }

  if (!linker) {
    return (
      <Page name="Linker Details" className="container mx-auto p-4">
        <div className="py-8 text-center">
          <p className="text-gray-500">Linker not found</p>
        </div>
      </Page>
    );
  }

  return (
    <Page name="Linker Details" className="container mx-auto p-4 space-y-6" linker={linker}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-x-2 space-y-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {linker.name || <span className="text-gray-400 italic">Unnamed Linker</span>}
              <Badge className={linker.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {linker.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">
              {linker.description || 'No description provided'}
            </CardDescription>
          </div>
          {userData.authority !== 'USER' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/linkers/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="text-left">
          <div className="space-y-4">
            {/* General Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Environment
                </Label>
                <div className="text-base">
                  {linker.environment ? (
                    <Badge>
                      {linker.environment}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Default Method
                </Label>
                <p className="text-base">
                  {linker.defaultMethodName || 'default'}
                </p>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Version
                </Label>
                <p className="text-base">
                  v{linker.version}
                </p>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Last Updated
                </Label>
                <p className="text-base">
                  {formatDate(linker.updatedAt)}
                </p>
              </div>

              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Datasources Count
                </Label>
                <p className="text-base">
                  {linker.datasourceIds?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Tabs */}
      <div className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mx-auto max-w-md w-full">
            <TabsTrigger value="details">Datasources</TabsTrigger>
            <TabsTrigger value="execution">Execution</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                {renderDatasourcesList()}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="execution" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                {renderExecutionDetails()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Page>
  );
}
