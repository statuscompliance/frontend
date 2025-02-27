import { signOut } from '@/services/auth';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';

export function Logout() {
  const { unauthenticate } = useAuth();
  unauthenticate();
  signOut();

  return (
    <Navigate to="/" replace />
  );
}
