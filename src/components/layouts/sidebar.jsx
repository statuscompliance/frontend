import {Home, FolderOpen, Shapes, Workflow, FileSliders, ChartNoAxesCombined, ChevronRight, ChevronsUpDown, LogOut, ShieldHalf, SquareAsterisk } from 'lucide-react';
import { Link } from 'react-router';
import { MoreHorizontal } from 'lucide-react';
import {
  useSidebar,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import logo from '@/assets/status.svg';

// Menu items.
const data = [
  {
    type: 'group',
    title: 'Application',
    items: [
      {
        title: 'Home',
        url: '/app',
        icon: Home,
      },
      {
        title: 'Catalogs',
        url: '/app/catalogs',
        icon: FolderOpen,
      },
      {
        title: 'Dashboards',
        url: '/app/dashboards',
        icon: ChartNoAxesCombined,
      },
      {
        title: 'Scopes',
        url: '/app/scopes',
        icon: Shapes,
      },
      {
        title: 'Mashups',
        url: '/app/mashups',
        icon: FileSliders,
      },
      {
        title: 'Editor',
        url: '/app/editor',
        icon: Workflow,
        roles: ['admin', 'developer'],
      },
    ]
  },
  {
    type: 'footer',
    title: 'Footer',
    items: [
      {
        type: 'item',
        title: 'Secrets',
        url: '/app/secrets',
        icon: SquareAsterisk,
      },
      {
        type: 'item',
        title: 'Logout',
        url: '/logout',
        icon: LogOut,
      },
      {
        type: 'item',
        title: '2FA Settings',
        url: '/app/setting-2fa',
        icon: ShieldHalf,
      },
    ]
  }
];

export function AppSidebar() {
  const {
    open,
    isMobile,
  } = useSidebar();
  const { userData } = useAuth();

  return (
    <Sidebar
      collapsible="icon"
      side={
        isMobile ? 'right' : 'left'
      }
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center justify-center">
            <div className={`hover:shadow-[0_0_8px_#bf0a2e] transition-duration-300 transition-filter will-change-filter flex aspect-square items-center justify-center rounded-lg bg-sidebar text-sidebar-foreground ${open || isMobile ? 'size-20' : 'size-8'}`}>
              <img
                src={logo}
                alt="statusImg"
                className=""
              />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="space-y-6 sm:space-y-3">
        {data.filter((item) => item.type === 'group').map((group) => (
          <SidebarGroup key={group.title}>
            <SidebarGroupLabel>
              <span className="text-sm text-sidebar-foreground font-medium">{group.title}</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-4 sm:space-y-2">
                {group.items.map((item) => (
                  (item.roles && item.roles.some(r =>
                    r === userData.authority.toLowerCase()
                  ) || item.roles == undefined) && (
                    item.items ? (
                      <CollapsibleItem key={item.title} item={item} />
                    ) : (
                      <NonCollapsibleItem key={item.title} item={item} />
                    )
                  )
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg">
                  {(open || isMobile) ? (
                    <FooterButton />
                  ) : null}
                  <ChevronsUpDown className="m-auto size-4"/>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="min-w-56 w-[--radix-dropdown-menu-trigger-width] rounded-lg bg-sidebar"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                {data.filter((item) => item.type === 'footer').map((item) => (
                  item.items.map((item, index) => (
                    <FooterItem key={item.title ? item.title : index} item={item} />
                  ))
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function NonCollapsibleItem({ item, ...props }) {
  return (
    <SidebarMenuItem key={props.key ? props.key : null}>
      <SidebarMenuButton asChild tooltip={item.title}>
        <Link to={item.url}>
          <item.icon />
          <span className="text-base font-medium">{item.title}</span>
        </Link>
      </SidebarMenuButton>
      {item.actions && !item.items ? (
        <DropdownMenu className="hidden">
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction>
              <MoreHorizontal />
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start">
            {item.actions.map((action) => (
              <DropdownMenuItem key={`${action.title}`}>
                <span onClick={action.onClick}>{action.title}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </SidebarMenuItem>
  );
}

function CollapsibleItem({ item, ...props }) {
  return (
    <Collapsible asChild defaultOpen={item.active ? item.active : false} key={props.key ? props.key : null} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton asChild tooltip={item.title}>
            <Link to={item.url}>
              <item.icon/>
              <span className="text-base font-medium">{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </Link>
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="pt-4 space-y-2 sm:pt-2 sm:space-y-1">
            {item.items && item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton asChild>
                  <Link to={subItem.url} className="text-base font-medium">{subItem.title}</Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function FooterItem({ item, ...props }) {
  return (
    item.type === 'separator' ? (
      <DropdownMenuSeparator key={props.key ? props.key : null}/>
    ) :
      item.type === 'item' ? (
        <DropdownMenuItem asChild key={props.key ? props.key : null} className="hover:cursor-pointer">
          <Link to={item.url}>
            <item.icon/>
            <span className="text-base font-medium">{item.title}</span>
          </Link>
        </DropdownMenuItem>
      ) :
        item.type === 'toggle' ? (
          <item.component{...item.props}key={props.key ? props.key : null} />
        ) : null
  );
}

function getAuthorityLabel(authority) {
  switch (authority) {
  case 'USER':
    return 'Manager';
  case 'DEVELOPER':
    return 'Technician';
  default:
    return authority;
  }
}

function FooterButton() {
  const { userData } = useAuth();
  return (
    <div className="grid flex-1 text-left text-sm leading-tight">
      <span className="truncate font-semibold">
        {userData && userData.email}
      </span>
      <span className="truncate text-xs">
        {userData && getAuthorityLabel(userData.authority)}
      </span>
    </div>
  );
}
