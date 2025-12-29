import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { Switch } from "@/components/ui/switch"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center justify-between w-full p-2 rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center gap-2">
        {isDark ? (
          <Moon className="h-4 w-4 text-primary" />
        ) : (
          <Sun className="h-4 w-4 text-primary" />
        )}
        <span className="text-sm font-medium">
          {isDark ? 'Dark' : 'Light'}
        </span>
      </div>
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle theme"
      />
    </div>
  );
}

