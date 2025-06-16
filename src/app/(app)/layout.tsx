
'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { FloatingVoiceInput } from '@/components/shared/FloatingVoiceInput'; // Added import

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
        <FloatingVoiceInput /> {/* Added floating voice input button */}
      </SidebarInset>
    </SidebarProvider>
  );
}
