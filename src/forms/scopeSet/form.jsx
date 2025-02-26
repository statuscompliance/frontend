import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Check } from 'lucide-react';
import { scopeSetSchema } from './schemas';
import { Badge } from '@/components/ui/badge';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export function ScopeSetForm({ onSubmit, controls, scopes, defaultValues, onCancel }) {
  const form = useForm({
    resolver: zodResolver(scopeSetSchema),
    defaultValues: defaultValues || {
      controlId: '',
      scopes: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'scopes',
  });

  const [selectedScopes, setSelectedScopes] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // If we have default values, setup the selected scopes
    if (defaultValues?.scopes) {
      setSelectedScopes(defaultValues.scopes.map(scope => scope.id));
    }
  }, [defaultValues]);

  const handleScopeSelection = (scopeId) => {
    setSelectedScopes(prev => {
      if (prev.includes(scopeId)) {
        // Remove from selected scopes
        const index = fields.findIndex((field) => field.id === scopeId);
        if (index !== -1) {
          remove(index);
        }
        return prev.filter(id => id !== scopeId);
      } else {
        // Add to selected scopes
        const scope = scopes.find(s => s.id === scopeId);
        if (scope) {
          append({ id: scope.id, name: scope.name, value: '' });
        }
        return [...prev, scopeId];
      }
    });
  };

  // Get available scopes that haven't been selected yet
  const availableScopes = scopes.filter(scope => !selectedScopes.includes(scope.id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
        {controls.length > 1 && (
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
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {fields.map((field) => (
            <Badge key={field.id} variant="outline" className="px-2 py-1 flex items-center gap-1">
              <span>
                {field.name}: {field.value}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 ml-1 hover:bg-destructive/10"
                onClick={() => handleScopeSelection(field.id)}
                type="button"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        {fields.length > 0 && (
          <div>
            {fields.map((field, index) => (
              <FormField
                key={field.id}
                control={form.control}
                name={`scopes.${index}.value`}
                render={({ field: inputField }) => (
                  <FormItem className="flex items-center space-x-2">
                    <div className="flex-grow">
                      <div className="flex items-center justify-between py-2">
                        <FormLabel className="mb-0">{field.name}</FormLabel>
                      </div>
                      <FormControl>
                        <Input placeholder={`Value for ${field.name}`} {...inputField} />
                      </FormControl>
                      <FormMessage />
                    </div>
                  </FormItem>
                )}
              />
            ))}
          </div>
        )}

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="px-2 w-32 justify-start"
            >
              <Plus className="mr-2 h-4 w-4 opacity-50" />
              {availableScopes.length > 0 ? 'Add Scope' : 'No more scopes available'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-full p-0">
            <Command>
              <CommandInput
                placeholder="Search scopes..."
                className="h-9 text-black" // Override muted text style
              />
              <CommandList>
                <CommandEmpty className="text-black text-sm py-4 px-2">No scope found.</CommandEmpty>
                <CommandGroup>
                  {availableScopes.map((scope) => (
                    <CommandItem
                      key={scope.id}
                      value={scope.id}
                      className="text-black"
                      onSelect={() => {
                        handleScopeSelection(scope.id);
                        setOpen(false);
                      }}
                    >
                      {scope.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            <X size="4" />
            Cancel
          </Button>
          <Button type="submit">
            <Check size="4" />
            Save
          </Button>
        </div>
      </form>
    </Form>
  );
}
