import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, ArrowRight, AlertCircle } from 'lucide-react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { format } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Schema validation for catalog info
const catalogInfoSchema = z.object({
  name: z.string()
    .min(1, { message: 'Catalog name is required' })
    .max(40, { message: 'Catalog name must be at most 40 characters' }), // Added max length
  description: z.string()
    .min(1, { message: 'Description is required' }) // Made description required
    .max(140, { message: 'Description must be at most 140 characters' }), // Added max length
  startDate: z.date({
    required_error: 'Start date is required',
  }),
  endDate: z.date({
    required_error: 'End date is required', // Made end date required
  }),
}).refine(data => {
  return data.startDate <= data.endDate;
}, {
  message: 'End date must be after start date',
  path: ['endDate']
});

const LOCALSTORAGE_KEY = 'catalogWizardCache'; // New constant for localStorage key

export function CatalogInfoStep({ initialData = {}, onSubmit, isSubmitting, apiError = null }) {
  const [submitError, setSubmitError] = useState(null);

  const form = useForm({
    resolver: zodResolver(catalogInfoSchema),
    defaultValues: {
      name: initialData.name || '',
      description: initialData.description || '',
      startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
      endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
    },
  });

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name || '',
        description: initialData.description || '',
        startDate: initialData.startDate ? new Date(initialData.startDate) : undefined,
        endDate: initialData.endDate ? new Date(initialData.endDate) : undefined,
      });
    }
  }, [initialData, form]);

  // Update error message when API error changes
  useEffect(() => {
    if (apiError) {
      setSubmitError(apiError);
    }
  }, [apiError]);

  // Save form values to localStorage on every change (New Feature)
  useEffect(() => {
    const subscription = form.watch((values) => {
      try {
        localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify({
          ...initialData, // Preserve initial data like ID if present
          ...values
        }));
      } catch (e) {
        // Silently catch localStorage errors (e.g., storage full)
        console.warn('Could not save to localStorage:', e);
      }
    });
    return () => subscription.unsubscribe(); // Cleanup subscription
  }, [form, initialData]);

  const handleSubmit = (data) => {
    setSubmitError(null);
    onSubmit(data);
  };

  return (
    <div className="py-4 text-left">
      <h2 className="mb-6 text-xl font-semibold">Basic Catalog Information</h2> {/* Updated title */}
      
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  Catalog Name <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter catalog name" 
                    {...field} 
                    disabled={isSubmitting} 
                    maxLength={40} // Added maxLength
                  />
                </FormControl>
                <FormMessage />
                {/* Character counter for name */}
                <div className="text-xs text-muted-foreground text-right">
                  {field.value?.length || 0}/40
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-medium">
                  Description <span className="text-red-500">*</span> {/* Added required indicator */}
                </FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter catalog description" 
                    rows={4}
                    {...field} 
                    disabled={isSubmitting} 
                    maxLength={140} // Added maxLength
                  />
                </FormControl>
                <FormMessage />
                {/* Character counter for description */}
                <div className="text-xs text-muted-foreground text-right">
                  {field.value?.length || 0}/140
                </div>
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base font-medium">
                    Start Date <span className="text-red-500">*</span>
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select start date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-base font-medium">
                    End Date <span className="text-red-500">*</span> {/* Added required indicator */}
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          disabled={isSubmitting}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Select end date</span>
                          )}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => 
                          date < new Date('1900-01-01') ||
                          (form.getValues('startDate') && date < form.getValues('startDate'))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="min-w-[120px] bg-chart-1 text-white hover:bg-green-600"
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
