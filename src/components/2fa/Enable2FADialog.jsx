import { useState, useEffect} from 'react';
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
import { setup2FA, verify2FA } from '@/services/auth';
import { Verify2FAForm } from '@/forms/auth/forms';
import { verify2FASchema } from '@/forms/auth/schemas';

export function Enable2FADialog({ open, onClose, onSuccess }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const form = useForm({
    resolver: zodResolver(verify2FASchema),
    defaultValues: {
      totpToken: '',
    },
  });

  useEffect(() => {
    if (open) {
      setError('');
      setup2FA()
        .then((res) => {
          setQrCode(res.qrCode);
        })
        .catch((err) => {
          console.error('QR error:', err);
          setError(err);
          toast.error('Failed to generate QR code');
        });
    } else {
      setQrCode(null);
    }
  }, [open]);


  const handleVerify = async (data) => {
    setLoading(true);
    try {
      await verify2FA({ totpToken: data.totpToken });

      toast.success('2FA enabled successfully');
      form.reset();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error('Invalid 2FA code');
      console.error('2FA verification error:', err);
    } finally {
      form.reset();
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          <DialogDescription>
            Scan the QR code with your authenticator app and enter the 6-digit code.
          </DialogDescription>
        </DialogHeader>
        {qrCode && (
          <div className="flex justify-center">
            <img src={qrCode} alt="2FA QR Code"/>
          </div>
        )}
        <Verify2FAForm form={form} onSubmit={handleVerify} isLoading={loading} error={error} />
      </DialogContent>
    </Dialog>
  );
}
