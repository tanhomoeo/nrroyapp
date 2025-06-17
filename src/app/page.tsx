'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// Import Firestore and db for the test
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Assuming db is exported directly

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // New Firestore read test
    const testFirestoreRead = async () => {
      console.log("Attempting Firestore read test from /__test_permissions__/testDoc ...");
      alert("Attempting a test read from Firestore to check permissions. Check the browser console (F12) for detailed logs.");
      try {
        const testDocRef = doc(db, "__test_permissions__", "testDoc");
        await getDoc(testDocRef);
        // If it reaches here without error, reads are allowed at some level.
        const successMsg = "Firestore read test: SUCCESSFUL (or document doesn't exist, which is fine for this permission test). No 'Missing or insufficient permissions' error for this specific read. This suggests basic read permissions are working. If other parts of your app fail, the issue might be with specific paths, write operations, or queries not covered by your current rules.";
        console.log(successMsg);
        alert(successMsg + "\n\nRedirecting to dashboard...");
        router.replace('/dashboard');
      } catch (error: any) {
        console.error("Firestore read test FAILED:", error);
        let alertMessage = `Firestore read test FAILED: ${error.message}.`;
        if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          alertMessage += `

This confirms a Firebase permission issue. PLEASE VERY CAREFULLY:
1. VERIFY that the 'projectId' in 'src/lib/firebase.ts' (currently: '${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'nrroyapp'}') EXACTLY matches your Firebase project ID in the Firebase Console.
2. ENSURE you have PUBLISHED the open Firestore rules ('allow read, write: if true;') to THAT EXACT project in the Firebase Console (Firestore Database -> Rules tab).
3. Check the browser console for the 'Firebase SDK Configuration Check' logs to verify all config values.`;
        } else {
          alertMessage += " An unexpected error occurred. Check the browser console (F12) for more details.";
        }
        alert(alertMessage);
        // console.log("Redirecting to dashboard despite test failure to check other operations...");
        // router.replace('/dashboard'); // Optionally redirect even on failure to test other parts
      }
    };

    // Run the test after a short delay
    const timerId = setTimeout(testFirestoreRead, 2500);
    return () => clearTimeout(timerId);

  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">Initializing & Testing Firebase Connection...</p>
    </div>
  );
}
