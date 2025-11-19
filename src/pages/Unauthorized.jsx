import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function Unauthorized() {
  const navigate = useNavigate();

  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl text-red-600">Unauthorized Access</h1>
      <p className="mt-4 text-gray-600">You do not have permission to access this section.</p>
      <div className="mt-6">
        <Button onClick={() => navigate('/')}>Return to Home</Button>
      </div>
    </div>
  );
}