import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarIcon, X, Check } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { controlSchema } from './schemas';

export function ControlForm({ onSubmit, onCancel, defaultValues }) {
  const form = useForm({
    resolver: zodResolver(controlSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      period: '',
      startDate: '',
      endDate: '',
      mashupId: '',
    },
  });

  // Helper function to handle date selection properly
  const handleDateSelect = (date, onChange) => {
    if (date) {
      // Create a date at noon to avoid timezone issues
      const safeDate = new Date(date);
      safeDate.setHours(12, 0, 0, 0);
      onChange(safeDate.toISOString().split('T')[0]);
    } else {
      onChange('');
    }
  };

  // Function to safely parse dates avoiding timezone issues
  const parseDate = (dateString) => {
    if (!dateString) return undefined;
    try {
      // Parse the date and set it to noon to avoid timezone issues
      const date = parseISO(dateString);
      date.setHours(12, 0, 0, 0);
      return date;
    } catch {
      return undefined;
    }
  };

  // Function to prevent event propagation to parent dialog
  const stopPropagation = (e) => {
    e.stopPropagation();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Control name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Control description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="period"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Period</FormLabel>
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
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        onClick={stopPropagation} // Prevent event propagation
                        type="button" // Ensure it's not submitting the form
                      >
                        {field.value ? (
                          format(parseDate(field.value), 'PPP')
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
                      selected={field.value ? parseDate(field.value) : undefined}
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
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        onClick={stopPropagation} // Prevent event propagation
                        type="button" // Ensure it's not submitting the form
                      >
                        {field.value ? (
                          format(parseDate(field.value), 'PPP')
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
                      selected={field.value ? parseDate(field.value) : undefined}
                      onSelect={(date) => handleDateSelect(date, field.onChange)}
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

        <div className="flex justify-end pt-4 space-x-2">
          <Button variant="outline" onClick={onCancel} type="button">
            <X className="mr-2 h-4 w-4"/>
            Cancel
          </Button>
          <Button type="submit">
            <Check className="mr-2 h-4 w-4"/>
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
