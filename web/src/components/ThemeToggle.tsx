'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        aria-label="Toggle theme"
        className="p-2 rounded-xl border border-gray-700/30 text-gray-400 opacity-60"
        style={{ width: '38px', height: '38px' }}
      >
        <span className="sr-only">Toggle theme</span>
      </button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label="Toggle theme"
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className="p-2 rounded-xl transition-all duration-200 border flex items-center justify-center cursor-pointer shadow-sm hover:scale-105"
      style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
        color: isDark ? '#00F0FF' : '#4F46E5',
      }}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform rotate-0 scale-100 text-cyan-400" />
      ) : (
        <Moon className="w-5 h-5 transition-transform rotate-0 scale-100 text-indigo-600" />
      )}
    </button>
  );
}
