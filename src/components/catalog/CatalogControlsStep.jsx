import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, ArrowRight, Plus, Trash, Edit, AlertCircle } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
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
  CardTitle
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Schema for control validation
const controlSchema = z.object({
  name: z.string().min(1, { message: 'Control name is required' }),
  description: z.string().min(1, { message: 'Description is required' }),
  type: z.string().min(1, { message: 'Control type is required' }),
  severity: z.string().min(1, { message: 'Severity is required' }),
  implementation: z.string().optional(),
});

// Control types and severity options
const controlTypes = [
  { value: 'preventive', label: 'Preventive' },
  { value: 'detective', label: 'Detective' },
  { value: 'corrective', label: 'Corrective' },
  { value: 'deterrent', label: 'Deterrent' },
  { value: 'recovery', label: 'Recovery' },
];

const severityLevels = [
  { value: 'critical', label: 'Critical', color: 'bg-red-500' },
  { value: 'high', label: 'High', color: 'bg-orange-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-green-500' },
  { value: 'informational', label: 'Informational', color: 'bg-blue-500' },
];

export function CatalogControlsStep({ initialControls = [], catalogId, onSubmit, isSubmitting, apiError = null }) {
  const [controls, setControls] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentControl, setCurrentControl] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Setup form with zod resolver
  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: '',
      description: '',
      type: '',
      severity: '',
      implementation: '',
    },
  });

  useEffect(() => {
    if (initialControls && initialControls.length > 0) {
      setControls([...initialControls]);
    }
  }, [initialControls]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  const handleAddControl = () => {
    setIsEditing(false);
    setCurrentControl(null);
    form.reset({
      name: '',
      description: '',
      type: '',
      severity: '',
      implementation: '',
    });
    setOpenDialog(true);
  };

  const handleEditControl = (control, index) => {
    setIsEditing(true);
    setCurrentControl({ ...control, index });
    form.reset({
      name: control.name,
      description: control.description,
      type: control.type,
      severity: control.severity,
      implementation: control.implementation || '',
    });
    setOpenDialog(true);
  };

  const handleDeleteControl = (index) => {
    const updatedControls = [...controls];
    updatedControls.splice(index, 1);
    setControls(updatedControls);
  };

  const handleControlSubmit = (data) => {
    if (isEditing && currentControl) {
      // Update existing control
      const updatedControls = [...controls];
      updatedControls[currentControl.index] = { 
        id: currentControl.id || `temp-${Date.now()}`,
        ...data 
      };
      setControls(updatedControls);
    } else {
      // Add new control
      setControls([
        ...controls, 
        { 
          id: `temp-${Date.now()}`,
          ...data 
        }
      ]);
    }
    setOpenDialog(false);
  };

  const closeDialog = () => {
    setOpenDialog(false);
  };

  const handleSubmit = () => {
    setSubmitError(null);
    
    if (controls.length === 0) {
      setSubmitError('You must add at least one control');
      return;
    }
    
    onSubmit(controls);
  };

  const getSeverityBadge = (severity) => {
    const severityInfo = severityLevels.find(level => level.value === severity);
    return (
      <Badge className={severityInfo ? severityInfo.color : 'bg-gray-500'}>
        {severityInfo ? severityInfo.label : severity}
      </Badge>
    );
  };

  return (
    <div className="py-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-left">Security Controls</h2>
        <Button 
          onClick={handleAddControl}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Control
        </Button>
      </div>

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

      {/* Controls list */}
      <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
        {controls.length === 0 ? (
          <div className="text-center py-10 bg-gray-50 border rounded-md">
            <p className="text-gray-500">No controls added yet. Click &quot;Add Control&quot; to start.</p>
          </div>
        ) : (
          controls.map((control, index) => (
            <Card key={control.id || index} className="hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2 flex flex-row justify-between">
                <div>
                  <CardTitle className="text-base font-medium flex items-center">
                    {control.name}
                    <span className="ml-3">
                      {getSeverityBadge(control.severity)}
                    </span>
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    Type: {controlTypes.find(type => type.value === control.type)?.label || control.type}
                  </p>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => handleEditControl(control, index)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteControl(index)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <p className="text-sm">{control.description}</p>
                {control.implementation && (
                  <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-700">
                    <strong>Implementation:</strong>
                    <p className="whitespace-pre-line mt-1">{control.implementation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Control form dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Edit Control' : 'Add New Control'}</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleControlSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Control Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="Enter control name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select control type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {controlTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="severity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Severity <span className="text-red-500">*</span></FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select severity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {severityLevels.map((level) => (
                            <SelectItem key={level.value} value={level.value}>
                              <div className="flex items-center">
                                <span className={cn('w-3 h-3 rounded-full mr-2', level.color)} />
                                {level.label}
                              </div>
                            </SelectItem>
                          ))}
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
                    <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Enter control description" 
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="implementation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Implementation Details</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe how this control should be implemented" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="ml-2"
                >
                  {isEditing ? 'Update Control' : 'Add Control'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Navigation buttons */}
      <div className="flex justify-end mt-8">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="bg-white hover:bg-secondary text-primary min-w-[120px]"
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
    </div>
  );
}