
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null; // Keep user for potential future use, but it won't gate access
  loading: boolean; // Set to false initially as we are not gating access
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: false, // Default to false as login is removed for access control
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  // Set loading to false initially since we are removing the login gate.
  // The onAuthStateChanged listener can still run to set the user if Firebase auth is used for other purposes.
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false); // Ensure loading is false after auth state is resolved
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    // This error can still be useful if other parts of the app expect AuthProvider
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
