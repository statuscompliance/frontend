import { useState } from 'react';
import { enable2FA } from '@/services/auth';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ShieldCheck } from 'lucide-react';

export function Enable2FA() {
  const [isLoading, setIsLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState(null);

  const handleEnable2FA = async () => {
    try {
      setIsLoading(true);

      // Warn the user this is non-reversible
      if (!window.confirm('Enabling 2FA will result on your account being locked if you lose access to your 2FA device. Are you sure you want to continue?')) {
        setIsLoading(false);
        return;
      }

      const response = await enable2FA();
      setTwoFactorData(response.data);
      setShowQR(true);
    } catch (error) {
      console.error('Failed to enable 2FA:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={handleEnable2FA}
        disabled={isLoading}
        className="gap-2"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShieldCheck className="h-4 w-4" />
        )}
        Enable 2FA
      </Button>

      <Dialog open={showQR} onOpenChange={setShowQR}>
        <DialogContent className="pr-6">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                {twoFactorData?.qrCodeUrl && (
                  <div className="flex justify-center items-center">
                    <img
                      src={`${twoFactorData.qrCodeUrl}`}
                      alt="2FA QR Code"
                      className="w-48 h-48"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert>
              <AlertDescription className="space-y-4">
                <h3 className="font-semibold">Follow these steps:</h3>
                <ol className="list-decimal pl-4 space-y-2">
                  <li>Download an authenticator app like Google Authenticator or Authy if you haven&apos;t already</li>
                  <li>Open your authenticator app and scan the QR code above or enter the code below manually</li>
                  <li>Your authenticator app will now show a 6-digit code that changes every 30 seconds</li>
                  <li>Use this code whenever you sign in to verify your identity</li>
                </ol>

                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm font-medium">Secret Code (Save this somewhere safe. Do not share)</p>
                  <code className="break-all block mt-1 p-2 bg-secondary rounded">
                    {twoFactorData?.secret}
                  </code>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
