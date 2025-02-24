import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { BreadcrumbItem } from '@/components/ui/breadcrumb';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';


export default function Page(props) {
  const isMobile = useIsMobile();
  return (
    <div className='h-full space-y-8'>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2">
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
            {props.name}
          </BreadcrumbItem>
        </div>
      </header>
      {props.children}
    </div>
  );
}