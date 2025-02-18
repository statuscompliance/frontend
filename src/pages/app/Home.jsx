import { useAuth } from '@/hooks/use-auth';

export function Home() {
  const { userData } = useAuth();
}
