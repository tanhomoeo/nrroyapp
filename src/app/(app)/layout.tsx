
'use client';
import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'; // Added SidebarTrigger
import { AppSidebar } from '@/components/shared/AppSidebar';
// AppHeader import removed

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-background">
        {/* AppHeader removed */}
        {/* Moved SidebarTrigger into main content area for visibility without a dedicated header */}
        <div className="sticky top-0 z-10 flex h-12 items-center justify-start border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 md:hidden">
          <SidebarTrigger />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    