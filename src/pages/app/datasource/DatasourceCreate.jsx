import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { ArrowLeft, Loader2, Save, Database, Shield, CheckCircle2 } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { createDatasource, getDatasourceTypes, testDatasourceConnection } from '@/services/datasources';

export function DatasourceCreate() {
  const navigate = useNavigate();
  const [datasourceTypes, setDatasourceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    configuration: {}
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchDatasourceTypes() {
      try {
        const types = await getDatasourceTypes();
        setDatasourceTypes(types);
      } catch (err) {
        toast.error('Failed to load datasource types');
        console.error('Error fetching datasource types:', err);
      }
    }
    
    fetchDatasourceTypes();
  }, []);

  const handleTypeChange = (value) => {
    setSelectedType(value);
    setFormData({
      ...formData,
      type: value,
      // Reset configuration when type changes
      configuration: {}
    });
    setConnectionStatus(null);
  };

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
      configuration: {
        ...formData.configuration,
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.type) {
      newErrors.type = 'Datasource type is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    const selectedTypeData = datasourceTypes.find(type => type.id === formData.type);
    if (selectedTypeData) {
      // Validate required auth fields
      selectedTypeData.authFields.forEach(field => {
        if (field.required && !formData.configuration[field.name]) {
          newErrors[`config.${field.name}`] = `${field.label} is required`;
        }
      });
      
      // Validate required config fields
      if (selectedTypeData.configFields) {
        selectedTypeData.configFields.forEach(field => {
          if (field.required && !formData.configuration[field.name]) {
            newErrors[`config.${field.name}`] = `${field.label} is required`;
          }
        });
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleTestConnection = async () => {
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setTestingConnection(true);
      await testDatasourceConnection(formData.configuration);
      setConnectionStatus('success');
      toast.success('Connection test successful');
    } catch (err) {
      setConnectionStatus('error');
      toast.error('Connection test failed');
      console.error('Error testing connection:', err);
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      setLoading(true);
      await createDatasource(formData);
      toast.success('Datasource created successfully');
      navigate('/app/datasources');
    } catch (err) {
      toast.error('Failed to create datasource');
      console.error('Error creating datasource:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthFields = () => {
    const selectedTypeData = datasourceTypes.find(type => type.id === selectedType);
    if (!selectedTypeData) return null;
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Authentication</h3>
        
        {selectedTypeData.authFields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="mb-1 block">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            
            {field.type === 'text' || field.type === 'password' ? (
              <Input
                id={field.name}
                type={field.type}
                value={formData.configuration[field.name] || ''}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className={errors[`config.${field.name}`] ? 'border-red-500' : ''}
              />
            ) : field.type === 'array' ? (
              <Input
                id={field.name}
                type="text"
                value={
                  Array.isArray(formData.configuration[field.name])
                    ? formData.configuration[field.name].join(', ')
                    : ''
                }
                onChange={(e) => handleConfigChange(field.name, e.target.value.split(',').map(s => s.trim()))}
                placeholder={`Enter ${field.label.toLowerCase()} (comma separated)`}
                className={errors[`config.${field.name}`] ? 'border-red-500' : ''}
              />
            ) : field.type === 'select' ? (
              <Select
                value={formData.configuration[field.name] || ''}
                onValueChange={(value) => handleConfigChange(field.name, value)}
              >
                <SelectTrigger className={errors[`config.${field.name}`] ? 'border-red-500' : ''}>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            
            {errors[`config.${field.name}`] && (
              <p className="mt-1 text-sm text-red-500">{errors[`config.${field.name}`]}</p>
            )}
          </div>
        ))}
        
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
                  <Database className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </>
            )}
          </Button>
          
          {connectionStatus === 'success' && (
            <div className="mt-3 flex items-center border border-green-200 rounded-md bg-green-50 p-3">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-500" />
              <p className="text-sm text-green-700">Connection successful. You can now save this datasource.</p>
            </div>
          )}
          
          {connectionStatus === 'error' && (
            <div className="mt-3 flex items-center border border-red-200 rounded-md bg-red-50 p-3">
              <Shield className="mr-2 h-5 w-5 text-red-500" />
              <p className="text-sm text-red-700">Connection failed. Please check your credentials and try again.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderConfigFields = () => {
    const selectedTypeData = datasourceTypes.find(type => type.id === selectedType);
    if (!selectedTypeData || !selectedTypeData.configFields || selectedTypeData.configFields.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          No additional configuration options available for this datasource type.
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Configuration</h3>
        
        {selectedTypeData.configFields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="mb-1 block">
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
            </Label>
            
            {field.type === 'text' ? (
              <Input
                id={field.name}
                type="text"
                value={formData.configuration[field.name] || field.default || ''}
                onChange={(e) => handleConfigChange(field.name, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                className={errors[`config.${field.name}`] ? 'border-red-500' : ''}
              />
            ) : field.type === 'select' ? (
              <Select
                value={formData.configuration[field.name] || field.default || ''}
                onValueChange={(value) => handleConfigChange(field.name, value)}
              >
                <SelectTrigger className={errors[`config.${field.name}`] ? 'border-red-500' : ''}>
                  <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'multiselect' ? (
              <div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {field.options.map((option) => {
                    const isSelected = Array.isArray(formData.configuration[field.name]) && 
                                      formData.configuration[field.name].includes(option);
                    
                    return (
                      <Badge
                        key={option}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentValues = Array.isArray(formData.configuration[field.name]) 
                            ? [...formData.configuration[field.name]] 
                            : [];
                          
                          if (isSelected) {
                            // Remove from selection
                            handleConfigChange(
                              field.name, 
                              currentValues.filter(val => val !== option)
                            );
                          } else {
                            // Add to selection
                            handleConfigChange(
                              field.name, 
                              [...currentValues, option]
                            );
                          }
                        }}
                      >
                        {option}
                      </Badge>
                    );
                  })}
                </div>
                {errors[`config.${field.name}`] && (
                  <p className="mt-1 text-sm text-red-500">{errors[`config.${field.name}`]}</p>
                )}
              </div>
            ) : null}
            
            {errors[`config.${field.name}`] && field.type !== 'multiselect' && (
              <p className="mt-1 text-sm text-red-500">{errors[`config.${field.name}`]}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Page name="Create Data Source" className="h-full w-full">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/app/datasources')}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Data Sources
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Create New Data Source</CardTitle>
            <CardDescription>
              Configure a new datasource to connect to external systems
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="mb-6 space-y-4">
                <div>
                  <Label htmlFor="name" className="mb-1 block">
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter datasource name"
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
                    placeholder="Enter datasource description"
                    className={errors.description ? 'border-red-500' : ''}
                    rows={3}
                  />
                  {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
                </div>
                
                <div>
                  <Label htmlFor="type" className="mb-1 block">
                    Datasource Type <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={handleTypeChange}
                  >
                    <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select datasource type" />
                    </SelectTrigger>
                    <SelectContent>
                      {datasourceTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="mt-1 text-sm text-red-500">{errors.type}</p>}
                </div>
                
                {selectedType && (
                  <div>
                    <div className="mb-2 mt-4">
                      <div className="flex flex-wrap gap-2">
                        {datasourceTypes
                          .find(type => type.id === selectedType)
                          ?.complianceStandards.map(standard => (
                            <Badge key={standard} variant="secondary">{standard}</Badge>
                          ))}
                      </div>
                    </div>
                    
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                      <TabsList className="grid grid-cols-2 w-full">
                        <TabsTrigger value="details">Authentication</TabsTrigger>
                        <TabsTrigger value="config">Configuration</TabsTrigger>
                      </TabsList>
                      <TabsContent value="details" className="pt-4">
                        {renderAuthFields()}
                      </TabsContent>
                      <TabsContent value="config" className="pt-4">
                        {renderConfigFields()}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => navigate('/app/datasources')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading || (selectedType && connectionStatus !== 'success')}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Data Source
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
