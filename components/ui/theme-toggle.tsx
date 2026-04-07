'use client';

import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ui/theme-provider';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme, isReady } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      aria-label={`切换到${isDark ? '浅色' : '深色'}主题`}
      className={cn(
        'h-9 w-9 border-slate-200 bg-white/80 text-slate-800 shadow-sm transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20',
        className,
      )}
      onClick={toggleTheme}
      disabled={!isReady}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
