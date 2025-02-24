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


{/* <SidebarProvider className="min-h-screen">
    <AppSidebar />
    <div className="flex py-2 flex-row w-full h-fit space-x-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <SidebarTrigger className={`${isMobile ? 'self-end fixed' : 'self-start'} hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}/>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ctrl + b</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <Separator orientation="vertical" className="my-1 h-5" />
      <BreadcrumbItem className="flex items-start my-0.5">
        {displayBreadcrumb}
      </BreadcrumbItem>
      <main className="flex-grow flex justify-center">
        <Outlet />
      </main>
    </div>
    <Toaster closeButton />
  </SidebarProvider> */}