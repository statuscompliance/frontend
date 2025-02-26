import { Outlet } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/sidebar';
import { Toaster } from '@/components/ui/sonner';

export default function AppLayout() {

  return (
    <SidebarProvider className="min-h-screen">
      <AppSidebar />
      <div className="flex w-full h-dvh">
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
      <Toaster closeButton />
    </SidebarProvider>
  );
}