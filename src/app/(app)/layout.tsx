
'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
import { AppHeader } from '@/components/shared/AppHeader';
// Auth-related imports are no longer needed here for redirection
// import { useAuth } from '@/contexts/AuthContext';
// import { useRouter } from 'next/navigation';
// import { ROUTES } from '@/lib/constants';
// import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { user, loading } = useAuth(); // No longer used for redirection logic here
  // const router = useRouter();

  // useEffect(() => { // Login redirection logic removed
  //   if (!loading && !user) {
  //     router.replace(ROUTES.LOGIN);
  //   }
  // }, [user, loading, router]);

  // if (loading) { // Loading state handled differently or removed if AuthContext changes
  //   return (
  //     <div className="flex h-screen w-screen items-center justify-center bg-background">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-3 text-lg text-foreground">অ্যাপ্লিকেশন লোড হচ্ছে...</p>
  //     </div>
  //   );
  // }

  // if (!user && !loading) { // Fallback if user is somehow null and not loading, though redirection is removed
  //   return (
  //      <div className="flex h-screen w-screen items-center justify-center bg-background">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-3 text-lg text-foreground">সাইন ইন পৃষ্ঠায় নিয়ে যাওয়া হচ্ছে...</p>
  //     </div>
  //   );
  // }

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
