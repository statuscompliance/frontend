import { Outlet } from 'react-router';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layouts/sidebar';

export default function AppLayout() {

  return (
    <SidebarProvider className="min-h-screen">
      <AppSidebar />
      <div className="w-full flex h-dvh">
        <main className="flex-grow">
          <Outlet />
        </main>
      </div>
    </SidebarProvider>
  );
}
