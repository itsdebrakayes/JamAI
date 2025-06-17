
import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * ThemeToggle Component
 * 
 * Provides a toggle button to switch between light and dark themes.
 * Uses CSS classes to apply theme changes and localStorage to persist user preference.
 * 
 * Features:
 * - Visual icons (Sun for light mode, Moon for dark mode)
 * - Smooth transitions between themes
 * - Persistent theme preference across sessions
 * - Accessible button with proper labeling
 */
const ThemeToggle = () => {
  // State to track current theme (true = dark, false = light)
  const [isDark, setIsDark] = React.useState(() => {
    // Check localStorage for saved theme preference on component mount
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    // Default to system preference if no saved theme
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  /**
   * Effect to apply theme changes to the document
   * Adds/removes 'dark' class on document root and saves preference
   */
  React.useEffect(() => {
    const root = document.documentElement;
    
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  /**
   * Effect to set initial theme on component mount
   * Ensures the theme is applied immediately when the app loads
   */
  React.useEffect(() => {
    const root = document.documentElement;
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
      root.classList.add('dark');
    } else if (savedTheme === 'light') {
      root.classList.remove('dark');
    } else {
      // Use system preference if no saved theme
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        setIsDark(true);
      }
    }
  }, []);

  /**
   * Toggles between light and dark theme
   * Updates state which triggers the useEffect to apply changes
   */
  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 hover:bg-muted transition-all duration-300 ease-in-out"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {/* Conditional rendering of icons with smooth transition */}
      <div className="relative w-4 h-4">
        <Sun 
          className={`absolute inset-0 h-4 w-4 transition-all duration-500 ease-in-out ${
            isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
          }`} 
        />
        <Moon 
          className={`absolute inset-0 h-4 w-4 transition-all duration-500 ease-in-out ${
            isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
          }`} 
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;
