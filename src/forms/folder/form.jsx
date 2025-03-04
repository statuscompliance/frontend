'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { folderFormSchema } from './schemas';

// Valor especial para representar "sin carpeta padre"
const NO_PARENT_VALUE = 'none';

export function FolderForm({ onClose, onSubmit, folders = [] }) {
  // Corregir el esquema y valores por defecto para evitar warning de input no controlado
  const form = useForm({
    resolver: zodResolver(folderFormSchema),
    defaultValues: {
      title: '',
      parentUid: NO_PARENT_VALUE, // Usar valor especial en lugar de cadena vacía
    },
  });

  const handleSubmit = (values) => {
    // Transformar el valor especial a undefined para la API
    const dataToSubmit = {
      ...values,
      parentUid: values.parentUid === NO_PARENT_VALUE ? undefined : values.parentUid
    };
    onSubmit(dataToSubmit);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your dashboards. You can optionally place it inside another folder.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Folder Name</FormLabel>
                  <FormControl>
                    <Input {...field} maxLength={100} placeholder="My Folder" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="parentUid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Folder (Optional)</FormLabel>
                  <Select 
                    value={field.value} 
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a parent folder (optional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={NO_PARENT_VALUE}>- No parent folder -</SelectItem>
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

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Create Folder</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
