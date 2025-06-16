'use client';
import React from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/shared/AppSidebar';
// import { useAuth } from '@/contexts/AuthContext'; // No longer needed for redirection
// import { useRouter } from 'next/navigation'; // No longer needed for redirection
// import { Loader2 } from 'lucide-react'; // No longer needed for loading screen

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // const { user, loading } = useAuth(); // Auth check removed
  // const router = useRouter(); // Auth check removed

  // useEffect(() => { // Auth check removed
  //   if (!loading && !user) {
  //     router.replace('/login');
  //   }
  // }, [user, loading, router]);

  // if (loading) { // Auth check loading screen removed
  //   return (
  //     <div className="flex h-screen w-screen items-center justify-center bg-background">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-3 text-lg text-foreground">অ্যাপ্লিকেশন লোড হচ্ছে...</p>
  //     </div>
  //   );
  // }

  // if (!user) { // Fallback for non-user state removed, access is now open
  //   return (
  //      <div className="flex h-screen w-screen items-center justify-center bg-background">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-3 text-lg text-foreground">পুনরায় নির্দেশিত করা হচ্ছে...</p>
  //     </div>
  //   );
  // }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="flex flex-col">
        <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-background">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
