import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Switch } from "@/components/ui/switch"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between w-full px-3 py-2 rounded-md border bg-background hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer" onClick={toggleTheme}>
      <div className="flex items-center gap-2">
        {isDark ? (
          <Moon className="h-4 w-4" />
        ) : (
          <Sun className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </span>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
        className="scale-90"
      />
    </div>
  );
}

