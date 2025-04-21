import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export function Logout() {
  const { unauthenticate } = useAuth();
  unauthenticate();

  return (
    <Navigate to="/" replace />
  );
}
