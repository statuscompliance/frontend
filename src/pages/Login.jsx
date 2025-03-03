import { LoginForm } from '@/forms/auth/forms';
import { loginSchema } from '@/forms/auth/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { signIn } from '@/services/auth';
import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    const hasAccessToken = storedUserData?.includes('accessToken');
    const hasNodeRedToken = storedUserData?.includes('nodeRedToken');
    if (storedUserData && hasAccessToken && hasNodeRedToken) {
      navigate('/app');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen">
      <div className="w-full flex items-center justify-center p-8">
        <LoginCard />
      </div>
    </div>
  );
}

function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { authenticate } = useAuth();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  function onSubmit(values) {
    setIsLoading(true);
    signIn(values)
      .then(async (response) => {
        const { message: _, ...userData } = response;
        localStorage.setItem('token', response.nodeRedToken);
        await authenticate(userData);
        navigate('/app');
      })
      .catch((err) => {
        if (err.response && err.response.status === 400) {
          setError('Invalid email or password');
        } else {
          setError('An error occurred. Please try again later.');
          console.error(err);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <Card className="w-full max-w-md rounded-lg shadow-sm">
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
