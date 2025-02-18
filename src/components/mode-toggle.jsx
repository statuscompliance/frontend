import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';

import { Button } from '@/components/ui/button';

export default function ModeToggle({ variant = 'icon', ...props }) {
  const { theme, setTheme } = useTheme();

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <Button variant="ghost" onClick={toggleTheme} {...props}>
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0  transition-all dark:rotate-0 dark:scale-100" />
      {variant === 'text' && <span className="text-base">Toggle Mode</span>}
    </Button>
  );
}
