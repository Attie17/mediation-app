import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function ThemeSwitcher({ variant = 'icon' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  if (variant === 'toggle') {
    return (
      <button
        onClick={toggleTheme}
        className="relative inline-flex items-center h-8 w-14 rounded-full bg-slate-700 dark:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        aria-label="Toggle theme"
      >
        <span
          className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${
            isDark ? 'translate-x-1' : 'translate-x-7'
          }`}
        >
          {isDark ? (
            <Moon className="w-4 h-4 text-slate-700 m-1" />
          ) : (
            <Sun className="w-4 h-4 text-yellow-500 m-1" />
          )}
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 border border-slate-600 dark:border-slate-500 transition-all duration-200"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-slate-400" />
      )}
    </button>
  );
}
