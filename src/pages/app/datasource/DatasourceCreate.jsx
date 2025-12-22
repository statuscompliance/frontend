import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import Page from '@/components/basic-page.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
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
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { createDatasource, getDatasourceTypes, testDatasourceConnection } from '@/services/datasources';
import { datasourceFormSchema } from '@/forms/datasource/schemas';

export function DatasourceCreate() {
  const navigate = useNavigate();
  const [datasourceTypes, setDatasourceTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedType, setSelectedType] = useState('');
  
  const form = useForm({
    resolver: zodResolver(datasourceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      definitionId: '',
      environment: 'dev',
      config: {
        baseUrl: '',
        username: '',
        password: '',
        timeout: 30000,
      }
    },
  });

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
    form.setValue('definitionId', value);
    setConnectionStatus(null);
  };

  const handleTestConnection = async (datasourceId) => {
    try {
      setTestingConnection(true);
      const result = await testDatasourceConnection(datasourceId);
      setConnectionStatus(result.testStatus === 'success' ? 'success' : 'error');
      toast.success(result.message || 'Connection test completed');
      return result;
    } catch (err) {
      setConnectionStatus('error');
      toast.error(err.message || 'Connection test failed');
      console.error('Error testing connection:', err);
      throw err;
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      const result = await createDatasource(values);
      toast.success('Datasource created successfully');
      
      // Test the connection after creation
      // Check different possible response structures
      const datasourceId = result.datasource?.id || result.id || result.data?.id;
      
      if (datasourceId) {
        setTestingConnection(true);
        try {
          const testResult = await handleTestConnection(datasourceId);
          if (testResult.testStatus === 'success') {
            toast.success('Connection test passed!');
          }
        } catch (testErr) {
          // Test failed but datasource was created
          toast.warning('Datasource created but connection test failed');
          console.log('Connection test failed after creation:', testErr);
        } finally {
          setTestingConnection(false);
        }
      }
      
      navigate('/app/datasources');
    } catch (err) {
      toast.error(err.message || 'Failed to create datasource');
      console.error('Error creating datasource:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderAuthFields = () => {
    const selectedTypeData = datasourceTypes.find(type => type.id === selectedType);
    if (!selectedTypeData || !selectedTypeData.authFields || selectedTypeData.authFields.length === 0) {
      return (
        <div className="py-4 text-center text-gray-500">
          No authentication fields defined for this datasource type.
        </div>
      );
    }
    
    const configValues = form.watch('config');
    
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
                value={configValues[field.name] || ''}
                onChange={(e) => form.setValue(`config.${field.name}`, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === 'array' ? (
              <Input
                id={field.name}
                type="text"
                value={
                  Array.isArray(configValues[field.name])
                    ? configValues[field.name].join(', ')
                    : ''
                }
                onChange={(e) => form.setValue(`config.${field.name}`, e.target.value.split(',').map(s => s.trim()))}
                placeholder={`Enter ${field.label.toLowerCase()} (comma separated)`}
              />
            ) : field.type === 'select' ? (
              <Select
                value={configValues[field.name] || ''}
                onValueChange={(value) => form.setValue(`config.${field.name}`, value)}
              >
                <SelectTrigger>
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
          </div>
        ))}
        
        <div className="mt-4 border border-blue-200 rounded-md bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            The connection will be tested automatically after creation.
          </p>
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
    
    const configValues = form.watch('config');
    
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
                value={configValues[field.name] || field.default || ''}
                onChange={(e) => form.setValue(`config.${field.name}`, e.target.value)}
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : field.type === 'select' ? (
              <Select
                value={configValues[field.name] || field.default || ''}
                onValueChange={(value) => form.setValue(`config.${field.name}`, value)}
              >
                <SelectTrigger>
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
                    const isSelected = Array.isArray(configValues[field.name]) && 
                                      configValues[field.name].includes(option);
                    
                    return (
                      <Badge
                        key={option}
                        variant={isSelected ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => {
                          const currentValues = Array.isArray(configValues[field.name]) 
                            ? [...configValues[field.name]] 
                            : [];
                          
                          if (isSelected) {
                            form.setValue(
                              `config.${field.name}`, 
                              currentValues.filter(val => val !== option)
                            );
                          } else {
                            form.setValue(
                              `config.${field.name}`, 
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
              </div>
            ) : null}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Page name="Create Data Source" className="h-full w-full">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>Create New Data Source</CardTitle>
            <CardDescription>
              Configure a new datasource to connect to external systems
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
              <CardContent>
                <div className="mb-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter datasource name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="environment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Environment</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select environment" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="dev">Development</SelectItem>
                              <SelectItem value="staging">Staging</SelectItem>
                              <SelectItem value="production">Production</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="Enter datasource description" rows={3} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="definitionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Datasource Type <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={handleTypeChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select datasource type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {datasourceTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {selectedType && (
                    <div>
                      {datasourceTypes
                        .find(type => type.id === selectedType)
                        ?.complianceStandards?.length > 0 && (
                        <div className="mb-2 mt-4">
                          <div className="flex flex-wrap gap-2">
                            {datasourceTypes
                              .find(type => type.id === selectedType)
                              ?.complianceStandards?.map(standard => (
                                <Badge key={standard} variant="secondary">{standard}</Badge>
                              ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 space-y-4">
                        <h3 className="text-lg font-medium">Connection Configuration</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="config.baseUrl"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Base URL <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} type="text" placeholder="http://example.com:8080" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="config.timeout"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Timeout (ms)</FormLabel>
                                <FormControl>
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder="30000"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || '')}
                                  />
                                </FormControl>
                                <p className="text-xs text-gray-500">Request timeout in milliseconds</p>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="config.username"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Username <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} type="text" placeholder="Enter username" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="config.password"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                                <FormControl>
                                  <Input {...field} type="password" placeholder="Enter password" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="mt-4 border border-blue-200 rounded-md bg-blue-50 p-3">
                          <p className="text-sm text-blue-700">
                            The connection will be tested automatically after creation.
                          </p>
                        </div>
                      </div>
                      
                      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                        <TabsList className="grid grid-cols-3 w-full">
                          <TabsTrigger value="details">Custom Fields</TabsTrigger>
                          <TabsTrigger value="config">Advanced</TabsTrigger>
                          <TabsTrigger value="json">JSON Editor</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details" className="pt-4">
                          {renderAuthFields()}
                        </TabsContent>
                        <TabsContent value="config" className="pt-4">
                          {renderConfigFields()}
                        </TabsContent>
                        <TabsContent value="json" className="pt-4">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Configuration (JSON)</h3>
                            <p className="text-sm text-gray-500">
                              Edit the complete configuration object for this datasource. Changes here will override the form fields above.
                            </p>
                            <Textarea
                              value={JSON.stringify(form.watch('config'), null, 2)}
                              onChange={(e) => {
                                try {
                                  const parsed = JSON.parse(e.target.value);
                                  form.setValue('config', parsed);
                                } catch (err) {
                                  // Invalid JSON, don't update
                                }
                              }}
                              placeholder='{\n  "baseUrl": "http://example.com",\n  "username": "admin",\n  "password": "secret"\n}'
                              className="font-mono text-sm"
                              rows={12}
                            />
                          </div>
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
                  disabled={loading || testingConnection}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={loading || testingConnection}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {testingConnection ? 'Testing connection...' : 'Creating...'}
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
          </Form>
        </Card>
      </div>
    </Page>
  );
}
