import { LoginForm } from '@/forms/auth/forms';
import { loginSchema } from '@/forms/auth/schemas';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logo from '@/assets/status.jpeg';
import { login } from '@/services/auth';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useAuth } from '@/hooks/use-auth';

export function Login() {
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
      email: '',
      password: '',
    },
  });

  function onSubmit(values) {
    navigate('/app');
    // setIsLoading(true);
    // login(values)
    //   .then(async (response) => {
    //     if (response.status === 200 && response.data.message === 'Login successful') {
    //       const { message: _, ...userData } = response.data;
    //       await authenticate(userData);
    //       navigate('/app');
    //     }

    //     else if (response.status === 200 && response.data.message === 'Credentials validated, please verify 2FA token')
    //       navigate('/verify-2fa', { state: { userId: response.data.userId } });
    //   })
    //   .catch((err) => {
    //     if (err.response && err.response.status === 400) {
    //       // Usually we would use form.setError, but in this case the 400 error only happens for "invalid credetials" which has no target field
    //       setError('Invalid email or password');
    //     } else {
    //       setError('An error occurred. Please try again later.');
    //       console.error(err);
    //     }
    //     setIconsRed();
    //   })
    //   .finally(() => {
    //     setIsLoading(false);
    //   });
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

function setIconsRed() {
  document.querySelectorAll('.pulse').forEach((div) => {
    div.classList.add('error-pulse');
    div.classList.remove('pulse');
  });
}
