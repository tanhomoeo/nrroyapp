'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Use the initialized auth instance
// Loader for full screen block removed

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Full screen loader removed. The `loading` state can be used by individual components if needed.
  // if (loading) {
  //   return (
  //     <div className="flex h-screen w-screen items-center justify-center bg-background">
  //       <Loader2 className="h-12 w-12 animate-spin text-primary" />
  //       <p className="ml-3 text-lg text-foreground">প্রমাণীকরণ লোড হচ্ছে...</p>
  //     </div>
  //   );
  // }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
