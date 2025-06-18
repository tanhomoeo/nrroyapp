
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '@/lib/firebase'; // Import firebaseConfig for alert

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const testFirestoreAccess = async () => {
      const testCollectionId = "app_permissions_test"; 
      const testDocId = "testDocument123";
      const testDocPath = `${testCollectionId}/${testDocId}`;
      console.log(`Attempting Firestore access test for path: ${testDocPath} in project ${firebaseConfig.projectId}`);
      const testDocRef = doc(db, testCollectionId, testDocId);

      let alertMessage = "Firebase Connection & Permission Test (Project: " + firebaseConfig.projectId + "):\n";
      alertMessage += "Using Full Config: " + JSON.stringify(firebaseConfig) + "\n\n";

      try {
        // Test Write
        console.log("Attempting Firestore WRITE to:", testDocRef.path);
        await setDoc(testDocRef, {
          timestamp: new Date().toISOString(),
          status: "Write test successful",
          random: Math.random()
        });
        const writeSuccessMsg = `Firestore WRITE test to ${testDocRef.path}: SUCCESSFUL.`;
        console.log(writeSuccessMsg);
        alertMessage += writeSuccessMsg + "\n";

        // Test Read
        console.log("Attempting Firestore READ from:", testDocRef.path);
        const docSnap = await getDoc(testDocRef);
        let readResult = "NOT FOUND (This is okay if write succeeded, means read also likely allowed)";
        if (docSnap.exists()) {
          readResult = `FOUND with data: ${JSON.stringify(docSnap.data())}`;
        }
        const readSuccessMsg = `Firestore READ test from ${testDocRef.path}: SUCCESSFUL. Document ${readResult}.`;
        console.log(readSuccessMsg);
        alertMessage += readSuccessMsg + "\n";

        // Test Delete
        console.log("Attempting Firestore DELETE for:", testDocRef.path);
        await deleteDoc(testDocRef);
        const deleteSuccessMsg = `Firestore DELETE test for ${testDocRef.path}: SUCCESSFUL.`;
        console.log(deleteSuccessMsg);
        alertMessage += deleteSuccessMsg + "\n";

        const finalSuccessMsg = "\nAll Firestore test operations (WRITE, READ, DELETE) appear to be working based on the homepage test for project '" + firebaseConfig.projectId + "'. If errors persist elsewhere, they might be related to specific complex queries or other Firebase services.";
        console.log(finalSuccessMsg);
        alertMessage += finalSuccessMsg;
        alert(alertMessage + "\n\nRedirecting to dashboard...");
        router.replace('/dashboard');

      } catch (error: any) {
        console.error(`Firestore access test FAILED for project ${firebaseConfig.projectId}:`, error);
        let detailedErrorMessage = `Firestore access test FAILED: ${error.message}. Code: ${error.code || 'N/A'}.\n`;
        if (error.message && error.message.toLowerCase().includes("missing or insufficient permissions")) {
          detailedErrorMessage += `
This STRONGLY confirms a Firebase permission issue OR a mismatch between your client config and the project where rules are published.
PLEASE VERY CAREFULLY:
1. VERIFY that ALL Firebase configuration values logged in the console (from 'src/lib/firebase.ts') EXACTLY match your Firebase project ID '${firebaseConfig.projectId}' in the Firebase Console.
2. ENSURE you have PUBLISHED the OPEN Firestore rules ('allow read, write: if true;') to THAT EXACT project ID ('${firebaseConfig.projectId}') in the Firebase Console (Firestore Database -> Rules tab).
3. Check if the Firestore API is enabled for the project in Google Cloud Console.
4. Check for any billing issues with your Firebase project.`;
        } else if (error.message && error.message.toLowerCase().includes("is invalid because it is reserved")) {
            detailedErrorMessage += `\nThe collection ID "${testCollectionId}" used for the test is invalid because it's reserved by Firebase. This is an error in the test code itself.`;
        } else {
          detailedErrorMessage += " An unexpected error occurred. Check the browser console (F12) for more details.";
        }
        alertMessage += detailedErrorMessage;
        alert(alertMessage);
        // Optionally, redirect to dashboard even on failure, or handle differently
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
        <p className="ml-3 text-lg text-foreground">Initializing & Testing Firebase Connection (Project: {firebaseConfig.projectId})...</p>
    </div>
  );
}
