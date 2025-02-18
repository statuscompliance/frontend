import { Outlet } from 'react-router';
import { Header } from '@/components/layouts/header';

export default function MainLayout() {
  return (
    <div className="py-2 min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow flex items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}
