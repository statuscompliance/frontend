import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X, Check, Loader2, AlertCircle } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { toast } from 'sonner'; // Import toast for messages
import { controlSchema } from './schemas'; // Ensure this schema is updated as described above

// Helper function to safely parse dates (from string to Date object)
const parseDate = (dateString) => {
  if (!dateString) return undefined;
  try {
    const date = parseISO(dateString);
    date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
    return date;
  } catch {
    return undefined;
  }
};

// Helper function to safely stringify scopes object to JSON
const stringifyScopes = (scopes) => {
  if (!scopes || Object.keys(scopes).length === 0) return '';
  try {
    return JSON.stringify(scopes, null, 2);
  } catch (e) {
    console.error('Error stringifying scopes:', e);
    return '';
  }
};

// Helper function to safely parse scopes JSON string to object
const parseScopes = (scopesString) => {
  if (!scopesString) return {};
  try {
    const parsed = JSON.parse(scopesString);
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('Scopes must be a JSON object');
    }
    return parsed;
  } catch (e) {
    console.error('Error parsing scopes JSON:', e);
    return {};
  }
};


export function ControlForm({ onSubmit, onCancel, defaultValues }) {
  const [confirmingScopes, setConfirmingScopes] = useState(false);
  const [cooldownActive, setCooldownActive] = useState(false);
  const [buttonText, setButtonText] = useState('Save');

  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: {
      name: defaultValues?.name || '',
      description: defaultValues?.description || '',
      period: defaultValues?.period || '',
      // Convert date strings from defaultValues to Date objects for the form
      startDate: defaultValues?.startDate ? parseDate(defaultValues.startDate) : undefined,
      endDate: defaultValues?.endDate ? parseDate(defaultValues.endDate) : undefined,
      mashupId: defaultValues?.mashupId || '',
      scopes: stringifyScopes(defaultValues?.scopes), // Stringify scopes for textarea
      endpoint: defaultValues?.endpoint || '', // Initialize endpoint
    },
  });

  // Reset confirmation state when form values change
  useEffect(() => {
    const subscription = form.watch(() => {
      setConfirmingScopes(false);
      setCooldownActive(false);
      setButtonText('Save');
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Helper function to handle date selection properly
  const handleDateSelect = (date, onChange) => {
    // Pass the Date object directly to react-hook-form
    onChange(date);
  };

  // Function to prevent event propagation to parent dialog
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  const handleFormSubmit = async (data) => {
    const parsedScopes = parseScopes(data.scopes);
    
    // Check if scopes are empty and if we are not already confirming
    if (Object.keys(parsedScopes).length === 0 && !confirmingScopes) {
      toast.info('You are about to create a control without scopes, confirm to continue.');
      setConfirmingScopes(true);
      setCooldownActive(true);
      setButtonText('Confirm');

      setTimeout(() => {
        setCooldownActive(false);
      }, 2000); // 2 seconds cooldown

      return; // Stop submission for the first attempt
    }

    // If scopes are empty and we are confirming, or if scopes are not empty, proceed
    try {
      // Ensure scopes are passed as an object to the onSubmit handler
      const dataToSubmit = {
        ...data,
        scopes: parsedScopes,
        // Convert Date objects back to ISO string for submission if needed by API
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      };
      await onSubmit(dataToSubmit);
      // Reset confirmation state on successful submission
      setConfirmingScopes(false);
      setCooldownActive(false);
      setButtonText('Save');
    } catch (error) {
      // Handle submission error, if any
      console.error('Submission error:', error);
      toast.error('Failed to save control. Please check your inputs.');
      setConfirmingScopes(false); // Reset on error
      setCooldownActive(false);
      setButtonText('Save');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Control name" {...field} maxLength={40} />
              </FormControl>
              <FormMessage />
              <div className="text-right text-xs text-muted-foreground">
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
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea placeholder="Control description" {...field} maxLength={140} rows={3} />
              </FormControl>
              <FormMessage />
              <div className="text-right text-xs text-muted-foreground">
                {field.value?.length || 0}/140
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="DAILY">Daily</SelectItem>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="YEARLY">Yearly</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date <span className="text-red-500">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        onClick={stopPropagation}
                        type="button"
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" onClick={stopPropagation}>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => handleDateSelect(date, field.onChange)}
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
                <FormLabel>End Date <span className="text-red-500">*</span></FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        onClick={stopPropagation}
                        type="button"
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start" onClick={stopPropagation}>
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => handleDateSelect(date, field.onChange)}
                      disabled={(date) => 
                        form.getValues('startDate') && date < form.getValues('startDate')
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

        <FormField
          control={form.control}
          name="mashupId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mashup ID</FormLabel>
              <FormControl>
                <Input placeholder="Enter mashup ID" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Endpoint field (display only) */}
        <FormField
          control={form.control}
          name="endpoint"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Endpoint</FormLabel>
              <FormControl>
                <Input placeholder="Endpoint will appear here" {...field} disabled={true} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Scopes field (Textarea for JSON input) */}
        <FormField
          control={form.control}
          name="scopes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Scopes (JSON)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder='Enter scopes as JSON object, e.g., {"key": "value"}' 
                  rows={5} 
                  {...field} 
                  value={field.value || ''} // Ensure value is controlled
                  onChange={(e) => {
                    // Attempt to parse JSON on change to provide immediate feedback
                    try {
                      JSON.parse(e.target.value);
                      form.clearErrors('scopes'); // Clear error if valid JSON
                    } catch {
                      // Set an error if JSON is invalid, but don't prevent input
                      form.setError('scopes', {
                        type: 'manual',
                        message: 'Invalid JSON format for scopes',
                      });
                    }
                    field.onChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4 space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            <X className="mr-2 h-4 w-4"/>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={cooldownActive} // Disable during cooldown
            className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white"
          >
            {cooldownActive ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {buttonText} {/* Shows "Confirm" after cooldown */}
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4"/>
                {buttonText} {/* Shows "Save" or "Confirm" */}
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
