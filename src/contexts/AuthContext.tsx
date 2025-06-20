
'use client';

import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { auth as firebaseAuthInstance } from '@/lib/firebase'; // Import Firebase auth instance

interface AuthContextType {
  user: User | null;
  loading: boolean;
  authError: Error | null; // To store any authentication errors
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true, // Start with loading true
  authError: null,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Initialize loading to true
  const [authError, setAuthError] = useState<Error | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    try {
      if (firebaseAuthInstance) {
        unsubscribe = onAuthStateChanged(firebaseAuthInstance, 
          (currentUser) => {
            setUser(currentUser);
            setLoading(false);
            setAuthError(null); // Clear any previous error
          }, 
          (error) => { // Error callback for onAuthStateChanged
            console.error("Firebase Auth State Error:", error);
            setUser(null);
            setLoading(false);
            setAuthError(error);
          }
        );
      } else {
        // This case indicates a problem with Firebase initialization in firebase.ts
        console.error("Firebase Auth instance is not available in AuthProvider.");
        setLoading(false);
        setAuthError(new Error("Firebase Auth not properly initialized."));
      }
    } catch (error: any) {
      // Catch any synchronous errors during setup
      console.error("Error setting up Firebase Auth listener:", error);
      setUser(null);
      setLoading(false);
      setAuthError(error);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <AuthContext.Provider value={{ user, loading, authError }}>
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
