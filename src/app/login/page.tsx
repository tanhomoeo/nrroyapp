
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ROUTES } from '@/lib/constants';

// This page is no longer used for login.
// It will redirect to the dashboard.
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(ROUTES.DASHBOARD);
  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="ml-3 text-lg text-foreground">লোড হচ্ছে...</p>
    </div>
  );
}
