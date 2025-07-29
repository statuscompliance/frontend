import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { dashboardFormSchema } from './schemas';
import { foldersService } from '@/services/grafana/folders';

// Default folder option
const defaultFolder = { uid: null, title: 'Default' };

export function DashboardForm({ onClose, onSubmit }) {
  const [folders, setFolders] = useState([defaultFolder]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await foldersService.getAll();
        const fetchedFolders = response.data || response;
        // Add the default folder and combine with fetched folders
        setFolders([
          defaultFolder,
          ...fetchedFolders.map(folder => ({ uid: folder.uid, title: folder.title }))
        ]);
      } catch (error) {
        console.error('Error loading folders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  const form = useForm({
    resolver: zodResolver(dashboardFormSchema),
    defaultValues: {
      name: '',
      folderId: null,
      startDate: new Date(),
      endDate: undefined,
    },
  });

  const handleSubmit = (values) => {
    onSubmit(values);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dashboard Name</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={40} />
                  </FormControl>
                  <FormMessage />
                  {/* Mostrar el contador de caracteres */}
                  <div className="text-right text-xs text-muted-foreground">
                    {field.value?.length || 0}/40
                  </div>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="folderId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <SelectTrigger>
                      <FormControl>
                        <SelectValue placeholder="Select folder" />
                      </FormControl>
                    </SelectTrigger>
                    <SelectContent>
                      {folders.map((folder) => (
                        <SelectItem key={folder.uid} value={folder.uid}>
                          {folder.title}
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
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
                  <FormLabel>End Date (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                          onBlur={field.onBlur}
                          ref={field.ref}
                        >
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
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
            <div className="flex justify-end space-x-2">
              <Button className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white" type="submit">Create Dashboard</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
