import { useTheme } from 'next-themes';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Wacht tot component is gemount om hydration mismatches te voorkomen
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <button
        className="p-2.5 rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
        aria-label="Thema laden..."
      >
        <Sun className="h-5 w-5" />
      </button>
    );
  }
  
  return (
    <button
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2.5 rounded-md bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 transition-colors"
      aria-label={theme === 'dark' ? 'Schakel naar lichte modus' : 'Schakel naar donkere modus'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
