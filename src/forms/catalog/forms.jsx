import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { catalogSchema } from './schemas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function CatalogForm({ catalog = {}, onSubmit, isSubmitting }) {
  const form = useForm({
    resolver: zodResolver(catalogSchema),
    defaultValues: {
      name: catalog.name || '',
      description: catalog.description || ''
    }
  });

  const { register, handleSubmit, formState } = form;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name" className="text-base font-medium">
          Catalog Name
        </Label>
        <Input
          id="name"
          {...register('name')}
          placeholder="Enter catalog name"
          disabled={isSubmitting}
          className={formState.errors.name ? 'border-red-500' : ''}
        />
        {formState.errors.name && (
          <p className="mt-1 text-sm text-red-500">{formState.errors.name.message}</p>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          {...register('description')}
          placeholder="Enter catalog description"
          rows={4}
          disabled={isSubmitting}
          className={formState.errors.description ? 'border-red-500' : ''}
        />
        {formState.errors.description && (
          <p className="mt-1 text-sm text-red-500">{formState.errors.description.message}</p>
        )}
      </div>
      
      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </form>    
  );  
}
