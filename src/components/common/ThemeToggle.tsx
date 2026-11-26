import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const STORAGE_KEY = 'nursego-theme';

export const ThemeToggle: React.FC = () => {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const nextDark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDark(nextDark);
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = nextDark ? 'dark' : 'light';
  }, []);

  const toggle = () => {
    const nextDark = !dark;
    setDark(nextDark);
    window.localStorage.setItem(STORAGE_KEY, nextDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = nextDark ? 'dark' : 'light';
    document.documentElement.style.colorScheme = nextDark ? 'dark' : 'light';
  };

  return (
    <button
      type="button"
      onClick={toggle}
      className="nursego-theme-toggle"
      aria-label={dark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={dark ? 'Mode terang' : 'Mode gelap'}
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline">{dark ? 'Terang' : 'Gelap'}</span>
    </button>
  );
};
