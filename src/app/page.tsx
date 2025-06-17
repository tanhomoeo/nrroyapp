'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
// Import Firestore and db for the test
import { doc, getDoc, setDoc } from 'firebase/firestore'; // Added setDoc for a write test
import { db } from '@/lib/firebase';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const testFirestoreAccess = async () => {
      const testDocPath = "__test_permissions__/testDoc";
      console.log(`Attempting Firestore access test for path: ${testDocPath}`);
      alert(`Attempting a test read and write from Firestore to check permissions. Path: ${testDocPath}. Check the browser console (F12) for detailed logs.`);

      try {
        // Test Write
        console.log("Attempting Firestore WRITE to:", testDocPath);
        const testDocRefWrite = doc(db, "__test_permissions__", "testDoc_WriteTest");
        await setDoc(testDocRefWrite, { timestamp: new Date().toISOString(), status: "Write test successful" });
        const writeSuccessMsg = `Firestore WRITE test to ${testDocPath}_WriteTest: SUCCESSFUL.`;
        console.log(writeSuccessMsg);
        alert(writeSuccessMsg);

        // Test Read
        console.log("Attempting Firestore READ from:", testDocPath); // Using a slightly different path for read test to ensure it's not a cached read if write failed silently
        const testDocRefRead = doc(db, "__test_permissions__", "testDoc_ReadTest");
        // Ensure document exists for read test, or create it if it doesn't
        try {
          await setDoc(testDocRefRead, { status: "Read test document pre-creation" }, { merge: true });
        } catch (setupError) {
          console.warn("Could not pre-create document for read test, continuing read attempt:", setupError);
        }
        const docSnap = await getDoc(testDocRefRead);
        let readResult = "NOT FOUND (which is okay for this permission test, as long as no permission error occurred)";
        if (docSnap.exists()) {
          readResult = `FOUND with data: ${JSON.stringify(docSnap.data())}`;
        }
        const readSuccessMsg = `Firestore READ test from ${testDocPath}_ReadTest: SUCCESSFUL. Document ${readResult}.`;
        console.log(readSuccessMsg);
        alert(readSuccessMsg);
        
        const finalSuccessMsg = "Firebase connection and basic Firestore read/write permissions appear to be working based on the homepage test. If errors persist elsewhere, they might be related to specific complex queries, rules on different paths, or other Firebase services.";
        console.log(finalSuccessMsg);
        alert(finalSuccessMsg + "\n\nRedirecting to dashboard...");
        router.replace('/dashboard');

      } catch (error: any) {
        console.error("Firestore access test FAILED:", error);
        let alertMessage = `Firestore access test FAILED: ${error.message}. Code: ${error.code || 'N/A'}.`;
        if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          alertMessage += `

This STRONGLY confirms a Firebase permission issue.
PLEASE VERY CAREFULLY:
1. VERIFY that ALL Firebase configuration values logged in the console (from 'src/lib/firebase.ts') EXACTLY match your Firebase project ID '${firebaseConfig.projectId}' in the Firebase Console. Check apiKey, authDomain, storageBucket, messagingSenderId, appId.
2. ENSURE you have PUBLISHED the OPEN Firestore rules ('allow read, write: if true;') to THAT EXACT project ID ('${firebaseConfig.projectId}') in the Firebase Console (Firestore Database -> Rules tab).
3. Check if the Firestore API is enabled for the project in Google Cloud Console.
4. Check for any billing issues with your Firebase project.`;
        } else {
          alertMessage += " An unexpected error occurred. Check the browser console (F12) for more details.";
        }
        alert(alertMessage);
        // Optionally, you might still want to redirect to see if other parts work, or halt here.
        // router.replace('/dashboard'); 
      }
    };

    // Run the test after a short delay to allow Firebase SDK to initialize
    const timerId = setTimeout(testFirestoreAccess, 2500);
    return () => clearTimeout(timerId);

  }, [router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-foreground">Initializing & Testing Firebase Connection...</p>
    </div>
  );
}
// Helper variable to access firebaseConfig for the alert message
const firebaseConfig = {
  projectId: "nrroyapp" // Ensure this matches the projectId in firebase.ts
};
