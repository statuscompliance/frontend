import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';

const secretSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['API_KEY', 'TOKEN', 'PASSWORD', 'OTHER'], {
    errorMap: () => ({ message: 'Type is required' }),
  }),
  //environment: z.string().min(1, 'Environment is required'),
  value: z.string().optional(),
});

export function SecretModal({ open, onClose, onSubmit, initialData }) {
  const isEditing = !!initialData?.id;

  const form = useForm({
    resolver: zodResolver(secretSchema),
    defaultValues: {
      name: '',
      type: undefined,
      environment: '',
      value: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (isEditing) {
        form.reset({
          name: initialData?.name || '',
          type: initialData?.type || undefined,
          environment: initialData?.environment || '',
          value: '',
        });
      } else {
        form.reset({
          name: '',
          type: undefined,
          environment: '',
          value: '',
        });
      }
    }
  }, [open, initialData, isEditing, form]);

  const handleSubmit = async (values) => {
    try {
      await onSubmit(values, initialData?.id);
    } catch (err) {
      toast.error('Unexpected error while trying to submit the secret.')
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Secret' : 'New Secret'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the secret details or rotate its value.'
              : 'Fill the form to create a new secret.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Secret name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="API_KEY">API_KEY</SelectItem>
                      <SelectItem value="TOKEN">TOKEN</SelectItem>
                      <SelectItem value="PASSWORD">PASSWORD</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isEditing ? 'New Value' : 'Value'}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Secret value" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button className="border-1 border-sidebar-accent bg-white text-sidebar-accent hover:bg-sidebar-accent hover:text-white" type="submit">{isEditing ? 'Save changes' : 'Create Secret'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
