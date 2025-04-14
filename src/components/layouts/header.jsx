import { useState } from 'react';
import logo from '@/assets/status.svg';
import { Link } from 'react-router';
import { Menu, ChevronDown } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

const expandableNavItems = [
  {
    title: 'About Us',
    items: [
      { title: 'Our Team', href: 'https://github.com/orgs/statuscompliance/people' },
    ]
  },
];

const navItems = [
  { title: 'Contact', href: 'https://github.com/orgs/statuscompliance' },
];

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="fixed left-0 top-0 z-50 w-full border-b border-background/20 bg-background/65 backdrop-blur-lg backdrop-filter">
      <div className="mx-auto max-w-7xl px-4 lg:px-8 sm:px-6">
        <div className="h-16 flex justify-between">
          <img src={logo} className="ml-8 h-14 w-14" alt="Status logo" />
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <nav className="flex">
              {expandableNavItems.map((item) =>
                <DropdownMenu key={item.title}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost">
                      {item.title}
                      <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {item.items.map((subItem) => (
                      <DropdownMenuItem key={subItem.title} asChild>
                        <Link to={subItem.href} className="rounded-md px-3 py-2 text-sm text-primary font-medium hover:bg-secondary/75 hover:text-primary">
                          {subItem.title}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              {navItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.href}
                  className="rounded-md px-3 py-2 text-sm text-primary font-medium hover:bg-secondary/35 hover:text-primary"
                >
                  {item.title}
                </Link>
              )
              )}
            </nav>
            <div className="ml-6">
              <Button variant="destructive" asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center sm:hidden">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="h-full flex flex-col">
                <nav className="flex flex-1 flex-grow flex-col overflow-y-auto pt-8 space-y-8">
                  <Accordion type="single" collapsible className="space-y-8"> {/* here space needs to be redeclared because items inside won't get it */}
                    {expandableNavItems.length > 0 && expandableNavItems.map((item, index) =>
                      <AccordionItem key={item.title} value={`value-${index + 1}`} className="border-none">
                        <AccordionTrigger className="py-0 text-base text-primary font-medium hover:text-primary">{item.title}</AccordionTrigger>
                        <AccordionContent className="flex flex-col pb-0">
                          {item.items.map((subItem) => (
                            <item key={subItem.title} className="pt-4">
                              <Link
                                to={subItem.href}
                                className="px-3 text-base text-primary/80 font-medium hover:text-primary"
                                onClick={() => setIsSidebarOpen(false)}
                              >
                                {subItem.title}
                              </Link>
                            </item>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    )}
                  </Accordion>
                  {navItems.map((item) => (
                    <Link
                      key={item.title}
                      to={item.href}
                      className="text-primary font-medium hover:text-primary"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      {item.title}
                    </Link>
                  )
                  )}
                </nav>
                <end className="w-full">
                  <Separator className="mb-8 w-full" />
                  <Button asChild className="w-full">
                    <Link to="/login" onClick={() => setIsSidebarOpen(false)}>
                      Login
                    </Link>
                  </Button>
                </end>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header >
  );
}
