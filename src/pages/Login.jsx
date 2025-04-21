import { LoginForm } from '@/forms/auth/forms';
import { loginSchema } from '@/forms/auth/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

export function Login() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app');
    }
  }, [navigate, isAuthenticated]);

  return (
    <div className="min-h-screen flex">
      <div className="w-full flex items-center justify-center p-8">
        <LoginCard />
      </div>
    </div>
  );
}

function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { authenticate } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  async function onSubmit(values) {
    setIsLoading(true);

    try {
      await authenticate(values);
    } catch (err) {
      if (err.response && err.response.status === 400) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again later.');
        console.error(err);
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="max-w-md w-full rounded-lg shadow-sm">
      <CardHeader className="items-start">
        <CardTitle>Log In</CardTitle>
        <CardDescription>Log In to STATUS</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm form={form} onSubmit={onSubmit} isLoading={isLoading} error={error} />
      </CardContent>
    </Card>
  );
}
