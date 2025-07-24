import { LoginForm } from '@/forms/auth/forms';
import { loginSchema } from '@/forms/auth/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Navigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

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
    <Card className="w-full max-w-md mx-auto p-6 bg-white shadow-lg rounded-lg">
      <LoginForm form={form} onSubmit={onSubmit} isLoading={isLoading} error={error} />
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
