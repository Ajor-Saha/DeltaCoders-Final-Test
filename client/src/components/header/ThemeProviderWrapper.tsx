'use client'

import { ThemeProvider } from 'next-themes';
import { useState, useEffect } from 'react';

const ThemeProviderWrapper = ({ children }: { children: React.ReactNode }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Return null during SSR to avoid mismatch, render the ThemeProvider only after mount
  if (!mounted) {
    return null;
  }

  return <ThemeProvider attribute="class" defaultTheme="system">{children}</ThemeProvider>;
};

export default ThemeProviderWrapper;
