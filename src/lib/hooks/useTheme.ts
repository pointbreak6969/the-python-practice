'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'theme';

function applyTheme(dark: boolean) {
  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useTheme() {
  // Default true matches the `dark` class we add to <html> server-side,
  // so there's no hydration mismatch.
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    const dark = stored !== 'light'; // default to dark
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  const toggle = () => {
    setIsDark((prev) => {
      const next = !prev;
      applyTheme(next);
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  };

  return { isDark, toggle };
}
