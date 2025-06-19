
'use client';
import React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
// Removed Sun, Moon, useTheme imports as theme toggle is removed

export function AppHeader() {
  // const { theme, setTheme } = useTheme(); // Removed theme logic

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger /> {/* Always visible, md:hidden removed implicitly by removing it */}
      </div>
      <div className="flex items-center gap-2">
        {/* Theme toggle button removed */}
      </div>
    </header>
  );
}
