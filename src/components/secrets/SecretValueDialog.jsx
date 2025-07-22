import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Copy } from 'lucide-react'; // Añade el icono Copy

export function SecretValueDialog({ open, onClose, secret }) {
  if (!secret) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secret.value);
    toast.success('Secret copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-auto max-w-full">
        <DialogHeader>
          <DialogTitle>Secret Value</DialogTitle>
          <DialogDescription>
            This value is shown only once. Copy and store it securely.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm">
            <strong>Name:</strong> {secret.name}
          </div>
          <div className="py-4">
            <div className="bg-gray-100 rounded px-4 py-4 m-2 text-sm overflow-x-auto flex items-start justify-between">
              <pre className="bg-transparent p-0 m-0 flex-1 select-all overflow-x-auto">
                <code>{secret.value}</code>
              </pre>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 mt-1"
                onClick={handleCopy}
                aria-label="Copy secret value"
                title="Copy secret value"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}