
'use client';
import React, { useEffect } from 'react'; // Added useEffect
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { AppHeader } from '@/components/shared/AppHeader';
import { useAuth } from '@/contexts/AuthContext'; // Added useAuth
import { useRouter } from 'next/navigation'; // Added useRouter
import { ROUTES } from '@/lib/constants'; // Added ROUTES
import { Loader2 } from 'lucide-react'; // Added Loader2

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(ROUTES.LOGIN);
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">অ্যাপ্লিকেশন লোড হচ্ছে...</p>
      </div>
    );
  }

  if (!user) {
    // This state can be brief as the useEffect above will redirect.
    // You could show a minimal loader or nothing.
    return (
       <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">সাইন ইন পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
