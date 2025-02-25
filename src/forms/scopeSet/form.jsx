import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { scopeSetSchema } from './schemas';

export function ScopeSetForm({ onSubmit, controls, scopes }) {
  const form = useForm({
    resolver: zodResolver(scopeSetSchema),
    defaultValues: {
      controlId: '',
      scopes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'scopes',
  });

  const handleScopeSelection = (checked, scope) => {
    if (checked) {
      append({ id: scope.id, name: scope.name, value: '' });
    } else {
      const index = fields.findIndex((field) => field.id === scope.id);
      if (index !== -1) {
        remove(index);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="controlId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Control</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a control" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {controls.map((control) => (
                    <SelectItem key={control.id} value={control.id}>
                      {control.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Select Scopes</FormLabel>
          {scopes.map((scope) => (
            <div key={scope.id} className="flex items-center space-x-2">
              <Checkbox
                id={`scope-${scope.id}`}
                onCheckedChange={(checked) => handleScopeSelection(checked, scope)}
              />
              <label
                htmlFor={`scope-${scope.id}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {scope.name}
              </label>
            </div>
          ))}
        </div>

        {fields.map((field, index) => (
          <FormField
            key={field.id}
            control={form.control}
            name={`scopes.${index}.value`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{scopes.find((scope) => scope.id === field.id)?.name}</FormLabel>
                <FormControl>
                  <Input placeholder={`Enter ${field.name}`} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}

        <Button type="submit">Add Scope Set</Button>
      </form>
    </Form>
  );
}
