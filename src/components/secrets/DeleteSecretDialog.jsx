import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function DeleteSecretDialog({ open, onClose, onConfirm, secret, loading }) {
  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the secret{' '}
            <strong className="text-foreground">{secret?.name}</strong>. This action
            <span className="text-destructive font-medium"> cannot be undone.</span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            onClick={onConfirm} // Directly call onConfirm when action button is clicked
            disabled={loading} // Disable the button while deletion is in progress
          >
            <Button
              className="bg-sidebar-accent"
              variant="destructive"
              disabled={loading} // Ensure it's disabled here too
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Secret'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/*import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

export function DeleteSecretDialog({ open, onClose, onConfirm, secret, loading }) {
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => {
    if (!open) setConfirmName('');
  }, [open]);

  const handleDelete = () => {
    if (confirmName === secret?.name) {
      onConfirm();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
          <AlertDialogDescription>
            To delete the secret <strong>{secret?.name}</strong>, type its name below.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-2">
          <Input
            placeholder="Enter secret name"
            value={confirmName}
            onChange={(e) => setConfirmName(e.target.value)}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700"
            disabled={confirmName !== secret?.name || loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              'Delete'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
*/
/*
import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export function DeleteSecretDialog({ open, onClose, onConfirm, secret, loading }) {
  const [inputName, setInputName] = useState('');

  useEffect(() => {
    if (open) setInputName('');
  }, [open]);

  const isMatch = inputName === secret?.name;

  return (
    <AlertDialog open={open} onOpenChange={(val) => !val && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Secret</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete the secret{' '}
            <strong className="text-foreground">"{secret?.name}"</strong>. This action
            <span className="text-destructive font-medium"> cannot be undone.</span>
            <br /><br />
            Please type the secret name to confirm:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Input
          autoFocus
          value={inputName}
          onChange={(e) => setInputName(e.target.value)}
          placeholder="Type secret name..."
        />

        <AlertDialogFooter className="pt-4">
          <AlertDialogCancel asChild>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </AlertDialogCancel>
          <AlertDialogAction
            asChild
            disabled={!isMatch || loading}
          >
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={!isMatch || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Secret'
              )}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
*/
