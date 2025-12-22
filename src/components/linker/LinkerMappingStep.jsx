import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export function LinkerMappingStep({ onSubmit, isSubmitting }) {
  const handleSubmit = () => {
    // Placeholder for future mapping functionality
    onSubmit({});
  };

  return (
    <div className="py-4">
      <h2 className="mb-6 text-xl font-semibold text-left">Data Mapping</h2>
      
      <div className="border border-gray-300 rounded-lg border-dashed bg-gray-50 p-12 text-center">
        <h3 className="mb-2 text-lg text-gray-900 font-medium">Mapping Configuration</h3>
        <p className="mb-6 text-gray-500">
          This step will allow you to map and transform data from the configured datasources.
        </p>
        <p className="text-sm text-gray-400">
          Mapping functionality will be available in a future update.
        </p>
      </div>

      <div className="flex justify-end pt-6 mt-8 border-t">
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="min-w-[120px]"
          variant="outline"
        >
          {isSubmitting ? (
            <>
              <span>Creating Linker...</span>
            </>
          ) : (
            <>
              Complete
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
