import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link, useLocation } from 'react-router-dom';

function generateBreadcrumbs(path, additionalData = {}) {
  const segments = path.split('/').filter(Boolean);
  
  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    // Detect if it's a catalog ID and if we have data for it
    const isCatalogId = segments[index-1] === 'catalogs' && !isNaN(segment);
    const catalogData = isCatalogId && additionalData.catalogData ? additionalData.catalogData : null;
    
    // Detect if we are in the control details view
    const isControlView = segments[index-1] === 'controls' && additionalData.control;
    
    let name = segment;
    
    // Normalize segment names
    if (segment.toLowerCase() === 'app') {
      name = 'Home';
    } else if (catalogData && isCatalogId) {
      name = catalogData.name || segment;
    } else if (segment === 'controls') {
      const catalogHref = '/' + segments.slice(0, index).join('/');
      return { name: 'Controls', href: catalogHref, isLast, state: additionalData };
    } else if (isControlView) {
      return { name: additionalData.control.name || 'Control Details', href: '', isLast: true, state: additionalData };
    } else if (segments[index-2] === 'controls') {
      return { name: 'Control Details', href: '', isLast: true, state: additionalData };
    } else {
      name = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return { 
      name, 
      href, 
      isLast,
      // Pass additional data in the state for relevant routes
      state: (segments[index-1] === 'catalogs' || segments[index] === 'catalogs') ? additionalData : null,
      uniqueKey: segments.slice(0, index + 1).join('/')
    };
  }).filter(crumb => crumb.name !== 'Home' || crumb.isLast);
}

export default function Page({ children, ...props }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  // Receive catalog and control data passed as props
  const catalogData = props.catalogData || location.state?.catalogData;
  const controlData = props.control || location.state?.control;
  const additionalData = { catalogData, control: controlData };
  
  // Generate breadcrumbs with additional data
  const breadcrumbs = generateBreadcrumbs(location.pathname, additionalData);

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
                <React.Fragment key={`${index}-${crumb.uniqueKey || crumb.href || crumb.name}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.isLast || crumb.href === '' ? (
                      <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link to={crumb.href} state={crumb.state}>
                          {crumb.name}
                        </Link>
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
