import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Edit, RefreshCw, CheckCircle2, Shield } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { getDatasourceById, getDatasourceTypes, testDatasourceConnection } from '@/services/datasources';
import { useAuth } from '@/hooks/use-auth';

export function DatasourceDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { userData } = useAuth();
  const [datasourceTypes, setDatasourceTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [datasource, setDatasource] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Cargar tipos de datasource
        const types = await getDatasourceTypes();
        setDatasourceTypes(types);
        
        // Cargar el datasource específico
        const data = await getDatasourceById(id);
        setDatasource(data);
        
        // Establecer el estado de prueba basado en los datos del datasource
        setConnectionStatus(data.testStatus === 'success' ? 'success' : 
          data.testStatus === 'failure' ? 'error' : null);
      } catch (err) {
        toast.error('Failed to load datasource');
        console.error('Error loading datasource:', err);
        navigate('/app/datasources');
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [id, navigate]);

  const handleTestConnection = async () => {
    try {
      setTestingConnection(true);
      const result = await testDatasourceConnection(id);
      setConnectionStatus(result.testStatus === 'success' ? 'success' : 'error');
      toast.success(result.message || 'Connection test completed');
    } catch (err) {
      setConnectionStatus('error');
      toast.error(err.message || 'Connection test failed');
      console.error('Error testing connection:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getDatasourceTypeLabel = (definitionId) => {
    const typeMap = {
      'rest-api': 'REST API',
      'microsoft-graph': 'Microsoft Graph',
      'owncloud': 'OwnCloud'
    };
    
    return typeMap[definitionId] || definitionId;
  };

  const renderFieldValue = (key, value, fieldSchema) => {
    // Handle password fields
    if (key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key === 'clientSecret') {
      return <span className="text-gray-400">••••••••</span>;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-400">-</span>;
      }
      return (
        <div className="flex flex-wrap gap-2">
          {value.map((item, index) => (
            <Badge key={index} variant="secondary">{String(item)}</Badge>
          ))}
        </div>
      );
    }
    
    // Handle objects (nested config)
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="border-l-2 border-gray-200 pl-4 space-y-2">
          {Object.entries(value).map(([nestedKey, nestedValue]) => (
            <div key={nestedKey} className="border-b pb-2 last:border-b-0">
              <Label className="mb-1 block text-xs text-gray-400 font-medium">
                {nestedKey}
              </Label>
              <div className="text-sm">
                {renderFieldValue(nestedKey, nestedValue, null)}
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    // Handle boolean
    if (typeof value === 'boolean') {
      return <Badge variant={value ? 'default' : 'outline'}>{value ? 'Yes' : 'No'}</Badge>;
    }
    
    // Handle primitives
    return <span>{value !== null && value !== undefined ? String(value) : '-'}</span>;
  };

  const renderAuthFields = () => {
    if (!datasource) return null;
    
    const selectedTypeData = datasourceTypes.find(type => type.id === datasource.definitionId);
    if (!selectedTypeData?.configSchema?.properties) {
      return (
        <div className="py-4 text-center text-gray-500">
          No configuration schema available for this datasource type.
        </div>
      );
    }
    
    // Get auth-related fields from config schema
    const authFieldKeys = Object.keys(selectedTypeData.configSchema.properties).filter(key => 
      key === 'auth' || 
      key.toLowerCase().includes('password') || 
      key.toLowerCase().includes('token') ||
      key.toLowerCase().includes('secret') ||
      key.toLowerCase().includes('username') ||
      key === 'tenantId' ||
      key === 'clientId' ||
      key === 'clientSecret'
    );
    
    if (authFieldKeys.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          No authentication fields configured for this datasource type.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Authentication</h3>
        
        {authFieldKeys.map((key) => {
          const fieldSchema = selectedTypeData.configSchema.properties[key];
          const value = datasource.config[key];
          
          return (
            <div key={key} className="border-b pb-3">
              <Label className="mb-1 block text-sm text-gray-500 font-medium">
                {fieldSchema?.description || key}
                {selectedTypeData.configSchema.required?.includes(key) && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>
              <div className="text-base">
                {renderFieldValue(key, value, fieldSchema)}
              </div>
            </div>
          );
        })}
        
        <div className="mt-6">
          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="w-full"
          >
            {testingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing Connection...
              </>
            ) : (
              <>
                {connectionStatus === 'success' ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </>
            )}
          </Button>
          
          {connectionStatus === 'success' && (
            <div className="mt-3 flex items-center border border-green-200 rounded-md bg-green-50 p-3">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">Connection successful.</p>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="mt-3 flex items-center border border-red-200 rounded-md bg-red-50 p-3">
              <Shield className="mr-2 h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">Connection failed. Please check your credentials.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfigFields = () => {
    if (!datasource) return null;
    
    const selectedTypeData = datasourceTypes.find(type => type.id === datasource.definitionId);
    if (!selectedTypeData?.configSchema?.properties) {
      return (
        <div className="py-4 text-center text-gray-500">
          No configuration schema available for this datasource type.
        </div>
      );
    }
    
    // Get non-auth related fields from config schema
    const configFieldKeys = Object.keys(selectedTypeData.configSchema.properties).filter(key => 
      key !== 'auth' && 
      !key.toLowerCase().includes('password') && 
      !key.toLowerCase().includes('token') &&
      !key.toLowerCase().includes('secret') &&
      key !== 'tenantId' &&
      key !== 'clientId' &&
      key !== 'clientSecret' &&
      key !== 'username'
    );
    
    if (configFieldKeys.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          No additional configuration options available for this datasource type.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configuration</h3>
        
        {configFieldKeys.map((key) => {
          const fieldSchema = selectedTypeData.configSchema.properties[key];
          const value = datasource.config[key];
          
          return (
            <div key={key} className="border-b pb-3">
              <Label className="mb-1 block text-sm text-gray-500 font-medium">
                {fieldSchema?.description || key}
                {selectedTypeData.configSchema.required?.includes(key) && (
                  <span className="ml-1 text-red-500">*</span>
                )}
              </Label>
              <div className="text-base">
                {renderFieldValue(key, value, fieldSchema)}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Page name="Data Source Details" className="h-full w-full" datasource={datasource}>
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading datasource...</span>
        </div>
      </Page>
    );
  }

  if (!datasource) {
    return (
      <Page name="Data Source Details" className="h-full w-full" datasource={datasource}>
        <div className="h-64 flex items-center justify-center">
          <p>Datasource not found</p>
        </div>
      </Page>
    );
  }

  return (
    <Page name="Data Source Details" className="container mx-auto p-4 space-y-6" datasource={datasource}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-x-2 space-y-0">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {datasource.name}
              <Badge className={datasource.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                {datasource.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-2">
              {datasource.description || 'No description provided'}
            </CardDescription>
          </div>
          {userData.authority !== 'USER' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/app/datasources/${id}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        
        <CardContent className="text-left">
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Type
                </Label>
                <p className="text-base">
                  {getDatasourceTypeLabel(datasource.definitionId)}
                </p>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Environment
                </Label>
                <div className="text-base">
                  {datasource.environment ? (
                    <Badge>
                      {datasource.environment}
                    </Badge>
                  ) : (
                    '-'
                  )}
                </div>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Version
                </Label>
                <p className="text-base">
                  v{datasource.version}
                </p>
              </div>
              
              <div>
                <Label className="mb-1 block text-sm text-gray-500 font-medium">
                  Last Updated
                </Label>
                <p className="text-base">
                  {formatDate(datasource.updatedAt)}
                </p>
              </div>
            </div>
            
            {/* Compliance Standards */}
            {datasource.definitionId && datasourceTypes.find(type => type.id === datasource.definitionId)?.complianceStandards && (
              <div className="pt-4">
                <Label className="mb-2 block text-sm text-gray-500 font-medium">
                  Compliance Standards
                </Label>
                <div className="flex flex-wrap gap-2">
                  {datasourceTypes
                    .find(type => type.id === datasource.definitionId)
                    ?.complianceStandards?.map(standard => (
                      <Badge key={standard} variant="secondary">{standard}</Badge>
                    ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for Auth and Config */}
      {datasource.definitionId && (
        <div className="space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mx-auto max-w-md w-full">
              <TabsTrigger value="details">Authentication</TabsTrigger>
              <TabsTrigger value="config">Configuration</TabsTrigger>
            </TabsList>
            <TabsContent value="details" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  {renderAuthFields()}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="config" className="pt-4">
              <Card>
                <CardContent className="pt-6">
                  {renderConfigFields()}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </Page>
  );
}
