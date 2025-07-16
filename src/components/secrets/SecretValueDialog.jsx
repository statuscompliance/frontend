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

export function SecretValueDialog({ open, onClose, secret }) {
  if (!secret) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(secret.value);
    toast.success('Secret copied to clipboard');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
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
          <div className="flex items-center justify-end py-4 space-x-2">
            {secret.value}
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button onClick={handleCopy}>Copy</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}