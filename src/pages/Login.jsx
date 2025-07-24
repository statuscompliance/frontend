import { LoginForm, Verify2FAForm } from '@/forms/auth/forms';
import { loginSchema, verify2FASchema } from '@/forms/auth/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [pendingLogin, setPendingLogin] = useState(null);
  const [requires2FA, setRequires2FA] = useState(false);

  const { authenticate } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const twoFAForm = useForm({
    resolver: zodResolver(verify2FASchema),
    defaultValues: {
      totpToken: '',
    },
  });

  const handleError = (err) => {
    const data = err.response?.data;
    const status = err.response?.status;
    const message = data?.message || 'An error occurred. Please try again later.';

    if (status >= 400 && status < 500) {
      setError(message);
      toast.error(message);
    } else {
      setError(message);
      console.error(err);
    }

    if (data?.requires2FA) {
      setRequires2FA(true);
      setPendingLogin(loginForm.getValues());
    }
  };

  async function onSubmitLogin(values) {
    setIsLoading(true);
    setError('');
    try {
      await authenticate(values);

    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function onSubmit2FA({ totpToken }) {
    if (!pendingLogin) return;

    setIsLoading(true);
    setError('');
    try {
      await authenticate({ ...pendingLogin, totpToken });
    } catch (err) {
      const status = err.response?.status;
      setError(status === 400 ? 'Invalid 2FA code' : 'An error occurred. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full rounded-lg shadow-sm">
      <CardHeader className="items-start">
        <CardTitle>Log In</CardTitle>
        <CardDescription>Log In to STATUS</CardDescription>
      </CardHeader>
      <CardContent>
        {!requires2FA ? (
          <LoginForm form={loginForm} onSubmit={onSubmitLogin} isLoading={isLoading} error={error} />
        ) : (
          <div className='space-y-4'>
            <Verify2FAForm form={twoFAForm} onSubmit={onSubmit2FA} isLoading={isLoading} error={error} />
            <Button className="w-full"
              variant='destructive'
              type="button"
              onClick={() => {
                setPendingLogin(null);
                setRequires2FA(false);
              }}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function Login() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  } else {
    return (
      <div className="min-h-screen flex">
        <div className="w-full flex items-center justify-center p-8">
          <LoginCard />
        </div>
      </div>
    );
  }
}
