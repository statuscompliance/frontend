import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { disable2FA } from '@/services/auth';
import { Disable2FAForm } from '@/forms/auth/forms';
import { disable2FASchema } from '@/forms/auth/schemas';

export function Disable2FADialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const form = useForm({
    resolver: zodResolver(disable2FASchema),
    defaultValues: {
      password: '',
      totpToken: '',
    },
  });

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');

    try {
      await disable2FA({
        password: data.password,
        totpToken: data.totpToken
      });
      toast.success('Two-Factor Authentication has been successfully disabled.');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('2FA disable error:', err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
        toast.error(err.response.data.message);
      } else {
        setError('Failed to disable 2FA. Please try again.');
        toast.error('Failed to disable 2FA. Please try again.');
      }
    } finally {
      form.reset();
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            To disable 2FA, please confirm your password and enter a valid 6-digit code from your authenticator app.
          </DialogDescription>
        </DialogHeader>
        <Disable2FAForm
          form={form}
          onSubmit={handleSubmit}
          isLoading={loading}
          error={error}
        />
      </DialogContent>
    </Dialog>
  );
}
