import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '@/components/ui/card';
import { get2FAStatus } from '@/services/auth';
import { Enable2FADialog } from '@/components/2fa/Enable2FADialog';
import { Disable2FADialog } from '@/components/2fa/Disable2FADialog';
import { Button } from '@/components/ui/button';
import Page from '@/components/basic-page.jsx';

export function TwoFADetails() {
  const [isEnableDialogOpen, setEnableDialogOpen] = useState(false);
  const [isDisableDialogOpen, setDisableDialogOpen] = useState(false);
  const [enabled, setEnabled] = useState(false);

  const refreshStatus = async () => {
    try {
      const res = await get2FAStatus();
      setEnabled(res.twofa_enabled);
    } catch {
      setEnabled(false);
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  return (
    <Page name="Two-Factor Authentication" className="h-full w-full">
      <CardHeader className="grid grid-cols-2 items-start gap-4 text-left">
        <CardContent>
          <CardTitle>Two-Factor Authentication (2FA)</CardTitle>
          <CardDescription className="mt-2 text-muted-foreground">
            Protect your account by enabling 2FA. You’ll need to enter a one-time code
            from an authenticator app every time you log in.
            <br />
            <br />
            <strong>Note:</strong> This feature currently works only with Chromium-based browsers.
          </CardDescription>
        </CardContent>
      </CardHeader>
      <Card className="flex items-center justify-center">
        {enabled ? (
          <CardContent className="text-center">
            <CardTitle className="m-4">2FA is Enabled</CardTitle>
            <CardDescription className="m-2">
              Two-Factor Authentication is currently active for your account.
              If you want to turn it off, click the button below.
            </CardDescription>
            <Button
              variant="destructive"
              onClick={() => setDisableDialogOpen(true)}
            >
              Disable 2FA
            </Button>
          </CardContent>
        ) : (
          <CardContent className="text-center">
            <CardTitle className="m-4">2FA is Disabled</CardTitle>
            <CardDescription className="m-2">
              Enhance your account security by enabling Two-Factor Authentication.
              It only takes a minute!
            </CardDescription>
            <Button onClick={() => setEnableDialogOpen(true)}>Enable 2FA</Button>
          </CardContent>
        )}
      </Card>

      <Enable2FADialog
        open={isEnableDialogOpen}
        onClose={() => setEnableDialogOpen(false)}
        onSuccess={refreshStatus}
      />

      <Disable2FADialog
        open={isDisableDialogOpen}
        onClose={() => setDisableDialogOpen(false)}
        onSuccess={refreshStatus}
      />
    </Page>
  );
}
