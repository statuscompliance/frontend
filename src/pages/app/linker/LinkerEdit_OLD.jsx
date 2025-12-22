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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Loader2, Save, Plus, Trash, Link as LinkIcon, Check } from 'lucide-react';
import { getAllDatasources } from '@/services/datasources';
import { getLinkerById, updateLinker, testLinkerConnection } from '@/services/linkers';

export function LinkerEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [datasources, setDatasources] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active',
    datasources: [],
    config: {
      refreshInterval: 'daily',
      notifyOnChange: true,
      mappings: []
    }
  });
  const [errors, setErrors] = useState({});
  const [sourceDatasource, setSourceDatasource] = useState('');
  const [targetDatasource, setTargetDatasource] = useState('');
  const [mappingFields, setMappingFields] = useState([
    { sourceField: '', targetField: '' }
  ]);

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
        
        setDatasources(datasourcesResponse.filter(ds => ds.status === 'active'));
        setFormData({
          name: linkerResponse.name || '',
          description: linkerResponse.description || '',
          status: linkerResponse.status || 'active',
          datasources: linkerResponse.datasources || [],
          config: linkerResponse.config || {
            refreshInterval: 'daily',
            notifyOnChange: true,
            mappings: []
          }
        });
        
        // Set initial connection status
        setConnectionStatus(linkerResponse.status === 'active' ? 'success' : null);
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
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleConfigChange = (field, value) => {
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        [field]: value
      }
    });
    
    // Clear error for this field
    if (errors[`config.${field}`]) {
      setErrors({
        ...errors,
        [`config.${field}`]: ''
      });
    }
  };

  const handleDatasourceToggle = (datasourceId) => {
    const currentDatasources = [...formData.datasources];
    
    if (currentDatasources.includes(datasourceId)) {
      // Remove datasource
      setFormData({
        ...formData,
        datasources: currentDatasources.filter(id => id !== datasourceId)
      });
      
      // Remove any mappings involving this datasource
      const updatedMappings = formData.config.mappings.filter(mapping => 
        mapping.source !== getDatasourceTypeById(datasourceId) && 
        mapping.target !== getDatasourceTypeById(datasourceId)
      );
      
      setFormData(prev => ({
        ...prev,
        config: {
          ...prev.config,
          mappings: updatedMappings
        }
      }));
    } else {
      // Add datasource
      setFormData({
        ...formData,
        datasources: [...currentDatasources, datasourceId]
      });
    }
    
    if (errors.datasources) {
      setErrors({
        ...errors,
        datasources: ''
      });
    }
  };

  const getDatasourceTypeById = (id) => {
    const datasource = datasources.find(ds => ds.id === id);
    return datasource ? datasource.type : null;
  };

  const getDatasourceById = (id) => {
    return datasources.find(ds => ds.id === id) || null;
  };

  const handleAddMapping = () => {
    if (!sourceDatasource || !targetDatasource) {
      toast.error('Please select both source and target datasources');
      return;
    }
    
    if (sourceDatasource === targetDatasource) {
      toast.error('Source and target datasources must be different');
      return;
    }
    
    // Check if this mapping already exists
    const existingMapping = formData.config.mappings.find(
      mapping => mapping.source === getDatasourceTypeById(sourceDatasource) && 
                mapping.target === getDatasourceTypeById(targetDatasource)
    );
    
    if (existingMapping) {
      toast.error('This mapping already exists');
      return;
    }
    
    if (mappingFields.some(field => !field.sourceField || !field.targetField)) {
      toast.error('Please fill in all mapping fields');
      return;
    }
    
    const newMapping = {
      source: getDatasourceTypeById(sourceDatasource),
      target: getDatasourceTypeById(targetDatasource),
      fieldMappings: [...mappingFields]
    };
    
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        mappings: [...formData.config.mappings, newMapping]
      }
    });
    
    // Reset the form for next mapping
    setSourceDatasource('');
    setTargetDatasource('');
    setMappingFields([{ sourceField: '', targetField: '' }]);
  };

  const handleRemoveMapping = (index) => {
    const updatedMappings = [...formData.config.mappings];
    updatedMappings.splice(index, 1);
    
    setFormData({
      ...formData,
      config: {
        ...formData.config,
        mappings: updatedMappings
      }
    });
  };

  const handleAddMappingField = () => {
    setMappingFields([...mappingFields, { sourceField: '', targetField: '' }]);
  };

  const handleRemoveMappingField = (index) => {
    const updatedFields = [...mappingFields];
    updatedFields.splice(index, 1);
    setMappingFields(updatedFields);
  };

  const handleMappingFieldChange = (index, field, value) => {
    const updatedFields = [...mappingFields];
    updatedFields[index][field] = value;
    setMappingFields(updatedFields);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (formData.datasources.length < 2) {
      newErrors.datasources = 'At least two datasources must be selected';
    }
    
    if (formData.config.mappings.length === 0) {
      newErrors.mappings = 'At least one mapping must be defined';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before testing');
      return;
    }
    
    try {
      setTestingConnection(true);
      await testLinkerConnection(formData);
      setConnectionStatus('success');
      toast.success('Linker configuration is valid');
    } catch (err) {
      setConnectionStatus('error');
      toast.error('Linker configuration test failed');
      console.error('Error testing linker:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }
    
    try {
      setLoading(true);
      await updateLinker(id, formData);
      toast.success('Linker updated successfully');
      navigate('/app/linkers');
    } catch (err) {
      toast.error('Failed to update linker');
      console.error('Error updating linker:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mostrar spinner mientras carga los datos iniciales
  if (initialLoading) {
    return (
      <Page name="Edit Linker" className="h-full w-full">
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading linker data...</span>
        </div>
      </Page>
    );
  }

  return (
    <Page name="Edit Linker" className="h-full w-full">
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
              Update linker configuration and mappings
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="general">General</TabsTrigger>
                  <TabsTrigger value="datasources">Datasources</TabsTrigger>
                  <TabsTrigger value="mappings">Mappings</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="mt-4 space-y-4">
                  <div>
                    <Label htmlFor="name" className="mb-1 block">
                      Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter linker name"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="description" className="mb-1 block">
                      Description <span className="text-red-500">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Enter linker description"
                      className={errors.description ? 'border-red-500' : ''}
                      rows={3}
                    />
                    {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                  </div>
                  
                  <div>
                    <Label htmlFor="status" className="mb-1 block">
                      Status
                    </Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => handleInputChange({ target: { name: 'status', value } })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="refreshInterval" className="mb-1 block">
                      Refresh Interval
                    </Label>
                    <Select
                      value={formData.config.refreshInterval}
                      onValueChange={(value) => handleConfigChange('refreshInterval', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select refresh interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="mt-4 flex items-center space-x-2">
                    <Checkbox 
                      id="notifyOnChange" 
                      checked={formData.config.notifyOnChange}
                      onCheckedChange={(checked) => handleConfigChange('notifyOnChange', checked)}
                    />
                    <Label htmlFor="notifyOnChange">Notify on changes</Label>
                  </div>
                </TabsContent>
                
                <TabsContent value="datasources" className="mt-4">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Select Datasources</h3>
                    {errors.datasources && <p className="mb-2 text-sm text-red-500">{errors.datasources}</p>}
                    
                    {loading ? (
                      <div className="h-32 flex items-center justify-center">
                        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                        <span>Loading datasources...</span>
                      </div>
                    ) : datasources.length === 0 ? (
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
                              formData.datasources.includes(datasource.id) 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:border-gray-400'
                            }`}
                            onClick={() => handleDatasourceToggle(datasource.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{datasource.name}</h4>
                                <p className="text-sm text-gray-600">{datasource.type}</p>
                              </div>
                              <Checkbox 
                                checked={formData.datasources.includes(datasource.id)} 
                                onCheckedChange={() => handleDatasourceToggle(datasource.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            <p className="mt-2 truncate text-sm">{datasource.description}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="mappings" className="mt-4">
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Configure Mappings</h3>
                    {errors.mappings && <p className="mb-2 text-sm text-red-500">{errors.mappings}</p>}
                    
                    {formData.datasources.length < 2 ? (
                      <div className="border rounded-md p-6 text-center">
                        <p className="text-gray-500">Please select at least two datasources first.</p>
                        <Button
                          variant="link"
                          onClick={() => setActiveTab('datasources')}
                        >
                          Go to Datasources
                        </Button>
                      </div>
                    ) : (
                      <>
                        {/* Existing mappings */}
                        {formData.config.mappings.length > 0 && (
                          <div className="mb-6">
                            <h4 className="mb-3 font-medium">Defined Mappings</h4>
                            <div className="space-y-3">
                              {formData.config.mappings.map((mapping, index) => (
                                <div key={index} className="border rounded-md p-4">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <div className="flex items-center">
                                        <Badge className="mr-2">Source</Badge>
                                        <span>{mapping.source}</span>
                                      </div>
                                      <div className="mt-1 flex items-center">
                                        <Badge className="mr-2">Target</Badge>
                                        <span>{mapping.target}</span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleRemoveMapping(index)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  <div className="mt-3">
                                    <h5 className="mb-2 text-sm font-medium">Field Mappings</h5>
                                    <div className="space-y-1">
                                      {mapping.fieldMappings.map((field, fidx) => (
                                        <div key={fidx} className="flex items-center text-sm">
                                          <span className="text-gray-600">{field.sourceField}</span>
                                          <span className="mx-2">→</span>
                                          <span className="text-gray-600">{field.targetField}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* New mapping form */}
                        <div className="border rounded-md bg-gray-50 p-4">
                          <h4 className="mb-4 font-medium">Add New Mapping</h4>
                          
                          <div className="grid grid-cols-1 mb-4 gap-4 md:grid-cols-2">
                            <div>
                              <Label className="mb-1 block">Source Datasource</Label>
                              <Select
                                value={sourceDatasource}
                                onValueChange={setSourceDatasource}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select source" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formData.datasources.map(id => {
                                    const ds = getDatasourceById(id);
                                    return ds ? (
                                      <SelectItem key={id} value={id}>
                                        {ds.name}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="mb-1 block">Target Datasource</Label>
                              <Select
                                value={targetDatasource}
                                onValueChange={setTargetDatasource}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select target" />
                                </SelectTrigger>
                                <SelectContent>
                                  {formData.datasources.map(id => {
                                    const ds = getDatasourceById(id);
                                    return ds ? (
                                      <SelectItem key={id} value={id}>
                                        {ds.name}
                                      </SelectItem>
                                    ) : null;
                                  })}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <div className="mb-4 space-y-3">
                            <h5 className="text-sm font-medium">Field Mappings</h5>
                            
                            {mappingFields.map((field, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  placeholder="Source field"
                                  value={field.sourceField}
                                  onChange={(e) => handleMappingFieldChange(index, 'sourceField', e.target.value)}
                                  className="flex-1"
                                />
                                <span>→</span>
                                <Input
                                  placeholder="Target field"
                                  value={field.targetField}
                                  onChange={(e) => handleMappingFieldChange(index, 'targetField', e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRemoveMappingField(index)}
                                  disabled={mappingFields.length === 1}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleAddMappingField}
                            >
                              <Plus className="mr-1 h-4 w-4" /> Add Field
                            </Button>
                            
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={handleAddMapping}
                              disabled={!sourceDatasource || !targetDatasource}
                            >
                              <LinkIcon className="mr-1 h-4 w-4" /> Add Mapping
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="mt-6 border-t pt-6">
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testingConnection}
                  className="w-full"
                >
                  {testingConnection ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing Configuration...
                    </>
                  ) : (
                    <>
                      {connectionStatus === 'success' ? (
                        <Check className="mr-2 h-4 w-4" />
                      ) : (
                        <LinkIcon className="mr-2 h-4 w-4" />
                      )}
                      Test Configuration
                    </>
                  )}
                </Button>
                
                {connectionStatus === 'success' && (
                  <div className="mt-3 flex items-center border border-green-200 rounded-md bg-green-50 p-3">
                    <Check className="mr-2 h-5 w-5 text-green-500" />
                    <p className="text-sm text-green-700">Configuration is valid. You can now save this linker.</p>
                  </div>
                )}
                
                {connectionStatus === 'error' && (
                  <div className="mt-3 flex items-center border border-red-200 rounded-md bg-red-50 p-3">
                    <Trash className="mr-2 h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">Configuration is invalid. Please check your settings and try again.</p>
                  </div>
                )}
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
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
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
