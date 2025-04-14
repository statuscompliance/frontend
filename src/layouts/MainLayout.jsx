import { Outlet } from 'react-router';
import { Header } from '@/components/layouts/header';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col py-2">
      <Header />
      <main className="flex flex-grow items-center justify-center">
        <Outlet />
      </main>
    </div>
  );
}
