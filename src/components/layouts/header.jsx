import { useState } from 'react';
import logo from '@/assets/status.jpeg';
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
      { title: 'Our Team', href: 'https://github.com/orgs/FIS2425/people' },
    ]
  },
];

const navItems = [
  { title: 'Contact', href: 'https://github.com/orgs/FIS2425' },
  { title: 'Terms', href: 'https://github.com/FIS2425/docs/wiki' },
];

export function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full bg-background/35 border-b border-background/20 backdrop-filter backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img src={logo} className="h-10 w-10" alt="Status logo" />
              <span className="ml-2 text-xl font-bold text-primary">STATUS</span>
            </div>
          </div>
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
                        <Link to={subItem.href} className="text-primary hover:bg-secondary/75 hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
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
                  className="text-primary hover:bg-secondary/75 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  {item.title}
                </Link>
              )
              )}
            </nav>
            <div className="ml-6">
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            </div>
          </div>
          <div className="flex items-center sm:hidden ">
            <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col h-full">
                <nav className="flex-1 flex flex-col flex-grow space-y-8 pt-8 overflow-y-auto">
                  <Accordion type="single" collapsible className="space-y-8"> {/* here space needs to be redeclared because items inside won't get it */}
                    {expandableNavItems.length > 0 && expandableNavItems.map((item, index) =>
                      <AccordionItem key={item.title} value={`value-${index + 1}`} className="border-none">
                        <AccordionTrigger className="text-base font-medium text-primary hover:text-primary py-0">{item.title}</AccordionTrigger>
                        <AccordionContent className="flex flex-col pb-0">
                          {item.items.map((subItem) => (
                            <item key={subItem.title} className="pt-4">
                              <Link
                                to={subItem.href}
                                className="text-primary/80 hover:text-primary px-3 font-medium text-base"
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
                      className="text-primary hover:text-primary font-medium"
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      {item.title}
                    </Link>
                  )
                  )}
                </nav>
                <end className="w-full">
                  <Separator className="w-full mb-8" />
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
