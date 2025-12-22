import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, AlertCircle, Plus, Trash, Eye } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { AddDatasourceDialog } from './AddDatasourceDialog';
import { saveLinkerDatasources, getLinkerDatasources } from '@/utils/linkerDraftStorage';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

// Schema validation for linker info
const linkerInfoSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  environment: z.string().min(1, { message: 'Environment is required' }),
});

export function LinkerDatasourcesStep({ initialData = {}, initialDatasources = [], onSubmit, isSubmitting, apiError = null }) {
  const [datasources, setDatasources] = useState([]);
  const [submitError, setSubmitError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [_selectedDatasource, setSelectedDatasource] = useState(null);

  const form = useForm({
    resolver: zodResolver(linkerInfoSchema),
    defaultValues: {
      name: initialData.name || '',
      description: initialData.description || '',
      environment: initialData.environment || 'dev',
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        environment: initialData.environment || 'dev',
      });
    }
  }, [initialData, form]);

  // Load datasources from localStorage on mount
  useEffect(() => {
    if (initialDatasources && initialDatasources.length > 0) {
      setDatasources(initialDatasources);
      saveLinkerDatasources(initialDatasources);
    } else {
      const cached = getLinkerDatasources();
      if (cached.length > 0) {
        setDatasources(cached);
      }
    }
  }, [initialDatasources]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  const handleAddDatasource = () => {
    setSelectedDatasource(null);
    setOpenDialog(true);
  };

  const handleDatasourceAdded = (datasourceConfig) => {
    const newDatasources = [...datasources, datasourceConfig];
    setDatasources(newDatasources);
    saveLinkerDatasources(newDatasources);
    setOpenDialog(false);
    toast.success('Datasource added successfully');
  };

  const handleRemoveDatasource = (index) => {
    const newDatasources = datasources.filter((_, i) => i !== index);
    setDatasources(newDatasources);
    saveLinkerDatasources(newDatasources);
    toast.success('Datasource removed');
  };

  const handleViewPreview = (datasource) => {
    setSelectedDatasource(datasource);
  };

  const handleSubmit = (formData) => {
    setSubmitError(null);
    
    if (datasources.length === 0) {
      setSubmitError('You must add at least one datasource');
      toast.error('At least one datasource must be added');
      return;
    }
    
    // Save before submitting
    saveLinkerDatasources(datasources);
    
    // Combine form data and datasources
    onSubmit({
      ...formData,
      datasources
    });
  };

  return (
    <div className="py-4">
      {/* Linker Information Section */}
      <h2 className="mb-6 text-left text-xl font-semibold">Linker Information</h2>
      
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Name (optional)
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter linker name (optional)" 
                      {...field} 
                      disabled={isSubmitting} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    If not provided, a name will be auto-generated
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="environment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium">
                    Environment <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
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
                <FormLabel className="text-base font-medium">
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter linker description" 
                    rows={2}
                    {...field} 
                    disabled={isSubmitting} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator className="my-8" />

          {/* Datasources Configuration Section */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-left text-xl font-semibold">Datasources Configuration</h2>
            <Button 
              type="button"
              onClick={handleAddDatasource}
              className="border-2 border-sidebar-accent bg-sidebar-accent hover:bg-secondary hover:text-sidebar-accent"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Datasource
            </Button>
          </div>

          {/* Empty state */}
          {datasources.length === 0 && (
            <div className="mb-6 border border-gray-300 rounded-lg border-dashed bg-gray-50 p-8 text-center">
              <h3 className="mb-1 text-lg text-gray-900 font-medium">No datasources configured yet</h3>
              <p className="mb-4 text-gray-500">Add datasources to aggregate data from multiple sources</p>
            </div>
          )}

          {/* Datasources list */}
          <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4">
            {datasources.map((ds, index) => (
              <Card key={index} className="transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row justify-between p-4 pb-2">
                  <div className="flex-1 text-left">
                    <CardTitle className="flex items-center text-base font-medium">
                      {ds.datasourceName}
                      <Badge variant="outline" className="ml-2">
                        {ds.methodName}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-500">
                      ID: {ds.datasourceId}
                    </p>
                  </div>
                  <div className="flex space-x-1">
                    <Button 
                      type="button"
                      size="sm" 
                      variant="ghost" 
                      className="text-red-500 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleRemoveDatasource(index)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-2">
                  {ds.options && Object.keys(ds.options).length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1">
                      <span className="text-sm text-gray-500">Options:</span>
                      {Object.entries(ds.options).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs">
                          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Datasource Dialog */}
          {openDialog && (
            <AddDatasourceDialog
              open={openDialog}
              onClose={() => setOpenDialog(false)}
              onSuccess={handleDatasourceAdded}
            />
          )}

          {/* Progress and Navigation */}
          <div className="mt-8 flex items-center justify-between border-t pt-4">
            <div className="text-sm text-gray-500">
              {datasources.length > 0 ? (
                <span>{datasources.length} datasource{datasources.length !== 1 ? 's' : ''} configured</span>
              ) : (
                <span>Add at least one datasource to continue</span>
              )}
            </div>
            <Button 
              type="submit"
              disabled={isSubmitting || datasources.length === 0}
              className="min-w-[120px] bg-white text-primary hover:bg-secondary"
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
        </form>
      </Form>
    </div>
  );
}
