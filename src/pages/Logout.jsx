import { useAuth } from '@/hooks/use-auth';
import { useMount } from 'ahooks';

export function Logout() {
  const { unauthenticate } = useAuth();
  useMount(() => unauthenticate());
}
