
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { firebaseConfig } from '@/lib/firebase'; // Keep import for project ID display

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Directly redirect, remove Firestore test for now
    // The Firestore access test can be moved to a dedicated test page or component if needed later.
    console.log("Attempting redirect from Home page to /dashboard for project:", firebaseConfig.projectId);
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">Redirecting to dashboard (Project: {firebaseConfig.projectId})...</p>
    </div>
  );
}

