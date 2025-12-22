import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Save, LinkIcon, RefreshCw } from 'lucide-react';
import { getAllDatasources } from '@/services/datasources';
import { getLinkerById, updateLinker, executeLinker } from '@/services/linkers';

export function LinkerEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [datasources, setDatasources] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    environment: 'dev',
    datasourceIds: [],
    defaultMethodName: 'default',
    isActive: true
  });
  const [errors, setErrors] = useState({});

  // Store the linker for breadcrumbs
  const [linker, setLinker] = useState(null);

  // Fetch datasources and linker data on component mount
  useEffect(() => {
    async function fetchData() {
      try {
        setInitialLoading(true);
        
        // Load datasources and linker in parallel
        const [datasourcesResponse, linkerResponse] = await Promise.all([
          getAllDatasources(),
          getLinkerById(id)
        ]);
        
        setDatasources(datasourcesResponse.filter(ds => ds.isActive !== false));
        setLinker(linkerResponse);
        setFormData({
          name: linkerResponse.name || '',
          description: linkerResponse.description || '',
          environment: linkerResponse.environment || 'dev',
          datasourceIds: linkerResponse.datasourceIds || [],
          defaultMethodName: linkerResponse.defaultMethodName || 'default',
          isActive: linkerResponse.isActive !== undefined ? linkerResponse.isActive : true
        });
      } catch (err) {
        toast.error('Failed to load linker data');
        console.error('Error loading data:', err);
        navigate('/app/linkers');
      } finally {
        setInitialLoading(false);
      }
    }
    
    fetchData();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleDatasourceToggle = (datasourceId) => {
    const currentDatasources = [...formData.datasourceIds];
    
    if (currentDatasources.includes(datasourceId)) {
      setFormData({
        ...formData,
        datasourceIds: currentDatasources.filter(id => id !== datasourceId)
      });
    } else {
      setFormData({
        ...formData,
        datasourceIds: [...currentDatasources, datasourceId]
      });
    }
    
    if (errors.datasourceIds) {
      setErrors({
        ...errors,
        datasourceIds: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (formData.datasourceIds.length < 1) {
      newErrors.datasourceIds = 'At least one datasource must be selected';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleExecute = async () => {
    try {
      setExecuting(true);
      const result = await executeLinker(id, { forceRefresh: true });
      toast.success('Linker executed successfully');
      console.log('Execution result:', result);
    } catch (err) {
      toast.error(err.message || 'Failed to execute linker');
      console.error('Error executing linker:', err);
    } finally {
      setExecuting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please select at least one datasource');
      return;
    }
    
    try {
      setLoading(true);
      // Ensure datasourceConfigs is always included (required field)
      const updatePayload = {
        ...formData,
        datasourceConfigs: formData.datasourceConfigs || {}
      };
      await updateLinker(id, updatePayload);
      toast.success('Linker updated successfully');
      navigate('/app/linkers');
    } catch (err) {
      toast.error(err.message || 'Failed to update linker');
      console.error('Error updating linker:', err);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Page name="Edit Linker" className="h-full w-full">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="mr-2 h-8 w-8 animate-spin" />
          <span>Loading linker data...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page name="Edit Linker" className="h-full w-full" linker={linker}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/linkers')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Linkers
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Edit Linker</CardTitle>
            <CardDescription>
              Update the configuration for this linker
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="space-y-6">
                {/* General Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">General Information</h3>
                  
                  <div>
                    <Label htmlFor="name" className="mb-1 block">
                      Name (optional)
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter linker name (optional)"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="mb-1 block">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter linker description"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="environment" className="mb-1 block">
                        Environment
                      </Label>
                      <Select
                        value={formData.environment}
                        onValueChange={(value) => setFormData({ ...formData, environment: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dev">Development</SelectItem>
                          <SelectItem value="staging">Staging</SelectItem>
                          <SelectItem value="production">Production</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="defaultMethodName" className="mb-1 block">
                        Default Method
                      </Label>
                      <Select
                        value={formData.defaultMethodName}
                        onValueChange={(value) => setFormData({ ...formData, defaultMethodName: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="default">Default</SelectItem>
                          <SelectItem value="getAll">Get All</SelectItem>
                          <SelectItem value="getById">Get By ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="isActive" className="mb-1 block">
                        Status
                      </Label>
                      <Select
                        value={formData.isActive ? 'active' : 'inactive'}
                        onValueChange={(value) => setFormData({ ...formData, isActive: value === 'active' })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                {/* Datasource Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Select Datasources</h3>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleExecute}
                      disabled={executing}
                    >
                      {executing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Execute Now
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {errors.datasourceIds && <p className="text-sm text-red-500">{errors.datasourceIds}</p>}
                  
                  <div className="border border-blue-200 rounded-md bg-blue-50 p-3">
                    <p className="text-sm text-blue-700">
                      <LinkIcon className="mr-1 inline-block h-4 w-4" />
                      Changes will be applied on save. The linker will cache results for 14 days.
                    </p>
                  </div>
                  
                  {datasources.length === 0 ? (
                    <div className="border rounded-md py-8 text-center">
                      <p className="text-gray-500">No active datasources found.</p>
                      <Button
                        variant="link"
                        onClick={() => navigate('/app/datasources/new')}
                        className="mt-2"
                      >
                        Create a datasource
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {datasources.map((datasource) => (
                        <div 
                          key={datasource.id} 
                          className={`border rounded-md p-4 cursor-pointer transition-colors ${
                            formData.datasourceIds.includes(datasource.id) 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'hover:border-gray-400'
                          }`}
                          onClick={() => handleDatasourceToggle(datasource.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <h4 className="font-medium">{datasource.name}</h4>
                                {datasource.environment && (
                                  <Badge variant="outline" className="ml-2 text-xs">
                                    {datasource.environment}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{datasource.definitionId}</p>
                              {datasource.description && (
                                <p className="mt-2 text-sm text-gray-500 line-clamp-2">{datasource.description}</p>
                              )}
                            </div>
                            <Checkbox 
                              checked={formData.datasourceIds.includes(datasource.id)} 
                              onCheckedChange={() => handleDatasourceToggle(datasource.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {formData.datasourceIds.length > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      <strong>{formData.datasourceIds.length}</strong> datasource{formData.datasourceIds.length > 1 ? 's' : ''} selected
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate('/app/linkers')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Update Linker
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </Page>
  );
}
