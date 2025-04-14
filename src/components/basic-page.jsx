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
    let href = '/' + segments.slice(0, index + 1).join('/');
    const isLast = index === segments.length - 1;
    
    // Detect if it's a catalog ID and if we have data for it
    const isCatalogId = segments[index-1] === 'catalogs' && !isNaN(segment);
    const catalogData = isCatalogId && additionalData.catalogData ? additionalData.catalogData : null;
    
    // Detect if we are in the control details view
    const isControlView = segments[index-1] === 'controls' && additionalData.control;
    
    // Detect if we are in computation details view
    const isComputationView = isLast && segments[index-1] === 'computations';
    
    // Detect if we are in folders or dashboards view
    const isFolder = segments[index-1] === 'folders';
    const isDashboard = segments[index-1] === 'dashboards' && segments[index] !== 'folders';
    
    // Detect if we are in the editor view
    const isEditor = segments[index-1] === 'editor';
    
    let name = segment;
    let isClickable = !isLast;
    
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
    } else if (isComputationView && additionalData.computationDate) {
      return { name: `Computation (${additionalData.computationDate})`, href: '', isLast: true, state: additionalData };
    } else if (segments[index-2] === 'controls') {
      return { name: 'Control Details', href: '', isLast: true, state: additionalData };
    } else if (segments[index] === 'folders') {
      return { name: 'Folders', href: '', isLast: true, state: additionalData };
    } else if (isFolder) {
      name = additionalData.folderData?.title || 'Folder';
      isClickable = false;
    } else if (isDashboard) {
      name = additionalData.dashboardData?.title || 'Dashboard';
    } else if (isEditor) {
      name = additionalData.flowName || 'Flow';
      isClickable = false;
    } else {
      name = segment.charAt(0).toUpperCase() + segment.slice(1);
    }

    return { 
      name, 
      href, 
      isLast,
      isClickable,
      state: (segments[index-1] === 'catalogs' || segments[index] === 'catalogs' || isFolder || isDashboard || isEditor) ? additionalData : null,
      uniqueKey: segments.slice(0, index + 1).join('/')
    };
  }).filter(crumb => crumb.name !== 'Home' || crumb.isLast);
}

export default function Page({ children, ...props }) {
  const isMobile = useIsMobile();
  const location = useLocation();
  
  const catalogData = props.catalogData || location.state?.catalogData;
  const controlData = props.control || location.state?.control;
  const folderData = props.folder || location.state?.folder;
  const dashboardData = props.dashboard || location.state?.dashboard;
  const flowName = props.flowName || location.state?.flowName;
  const computationDate = props.computationDate || location.state?.computationDate;
  
  const additionalData = { 
    catalogData, 
    control: controlData, 
    folderData, 
    dashboardData, 
    flowName, 
    computationDate 
  };
  
  const breadcrumbs = generateBreadcrumbs(location.pathname, additionalData);

  return (
    <div className="h-full space-y-8">
      {/* TODO: Check why group-has-* class was working before switching to UnoCSS */}
      <header className="group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 h-16 flex shrink-0 items-center gap-2 transition-[width,height] ease-linear">
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarTrigger
                  className={`${isMobile ? 'self-end fixed' : 'self-start'} hover:bg-sidebar-accent hover:text-sidebar-foreground`}
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
                    {crumb.isLast || !crumb.isClickable || crumb.href === '' ? (
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
