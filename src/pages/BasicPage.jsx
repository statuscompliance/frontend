import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation } from 'react-router-dom';

function generateBreadcrumbs(path) {
  const segments = path.split('/').filter(Boolean);

  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;

    const name = segment.toLowerCase() === 'app' ? 'Home' : segment.charAt(0).toUpperCase() + segment.slice(1);
    if (name === 'Controls') {
      return { name, href: '', isLast };
    }

    return { name, href, isLast };
  }).filter(crumb => crumb.name !== 'Home' || crumb.isLast); // Avoid "Home" unless it's the last segment
}

export default function Page({ children }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const breadcrumbs = generateBreadcrumbs(location.pathname);

  return (
    <div className="h-full space-y-8">
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger
                  className={`${isMobile ? 'self-end fixed' : 'self-start'} hover:bg-sidebar-accent hover:text-sidebar-accent-foreground`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ctrl + b</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Separator orientation="vertical" className="my-1 h-5" />

          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => (
                <React.Fragment key={crumb.href}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast || crumb.href === '' ? (
                      <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink>
                        <Link to={crumb.href}>{crumb.name}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      {children}
    </div>
  );
}
