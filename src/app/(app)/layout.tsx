
'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { AppHeader } from '@/components/shared/AppHeader';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col bg-background"> {/* Ensured bg-background is applied */}
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6"> {/* Removed bg-background, will inherit from SidebarInset */}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

    