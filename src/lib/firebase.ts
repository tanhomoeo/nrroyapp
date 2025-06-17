
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// WARNING: For a live production application, it is STRONGLY RECOMMENDED
// to use environment variables to store your Firebase configuration
// instead of hardcoding them directly in the source code.
// See: https://firebase.google.com/docs/web/learn-more#config-object

const firebaseConfig = {
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj", // YOUR PROVIDED API KEY
  authDomain: "nrroyapp.firebaseapp.com", // CRITICAL: Replace with your actual Project ID if different
  projectId: "nrroyapp", // CRITICAL: Replace with your actual Firebase Project ID if different
  storageBucket: "nrroyapp.appspot.com", // CRITICAL: Replace with your actual Project ID if different
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // CRITICAL: Replace with your Messaging Sender ID from Firebase Console for the 'nrroyapp' project
  appId: "YOUR_APP_ID", // CRITICAL: Replace with your App ID from Firebase Console for the 'nrroyapp' project
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Measurement ID from Firebase Console for the 'nrroyapp' project
};

// --- CRITICAL DIAGNOSTIC LOG ---
// When your app loads in the browser, check the Developer Console.
// The Project ID logged here MUST EXACTLY MATCH the Project ID
// in the Firebase Console where you have set your Firestore Security Rules.
if (typeof window !== 'undefined') {
  console.log("============================================================");
  console.log("Firebase SDK Initializing with Configuration:");
  console.log("Project ID (from firebaseConfig):", firebaseConfig.projectId);
  console.log("Auth Domain (from firebaseConfig):", firebaseConfig.authDomain);
  console.log("API Key (first 5 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "NOT SET");
  console.log("Ensure these details EXACTLY match your Firebase project settings where Firestore rules are published.");
  console.log("If you still get permission errors, verify ALL config values above are correct for the project '" + firebaseConfig.projectId + "' in your Firebase Console.");
  console.log("Specifically, check 'Messaging Sender ID' and 'App ID'.");
  console.log("============================================================");

  if (firebaseConfig.projectId !== "nrroyapp" ||
      !firebaseConfig.authDomain.includes("nrroyapp.firebaseapp.com") ||
      !firebaseConfig.storageBucket.includes("nrroyapp.appspot.com")) {
    console.error(
      "CRITICAL CONFIG MISMATCH: The projectId, authDomain, or storageBucket in src/lib/firebase.ts " +
      "does NOT seem to match the 'nrroyapp' project consistently. Please ensure all these values " +
      "are for the 'nrroyapp' project, or update 'nrroyapp' to your correct Firebase Project ID everywhere in this config."
    );
  }
  if (firebaseConfig.messagingSenderId === "YOUR_MESSAGING_SENDER_ID" ||
      firebaseConfig.appId === "YOUR_APP_ID") {
    console.warn(
      "Firebase config in src/lib/firebase.ts is using placeholder values for 'messagingSenderId' or 'appId'. " +
      "Please replace these with your actual Firebase project details for the application to work correctly with all Firebase services."
    );
  }
}
// --- END CRITICAL DIAGNOSTIC LOG ---

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') console.log("Firebase App Initialized (New Instance).");
} else {
  app = getApp();
  if (typeof window !== 'undefined') console.log("Firebase App Re-initialized (Existing Instance).");
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId && firebaseConfig.measurementId !== "YOUR_MEASUREMENT_ID") {
      try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics Initialized.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    }
  }).catch(error => {
    console.error("Firebase Analytics: Error checking support:", error);
  });
}

export {
  app,
  auth,
  db,
  storage,
  analytics
};
