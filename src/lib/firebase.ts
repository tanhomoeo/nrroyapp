
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics"; // Optional, if using Analytics

// Your web app's Firebase configuration variables from .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp;

// Diagnostic log for API key
const apiKeyFromEnv = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (typeof window !== 'undefined') { // Run console logs only on the client-side
    console.log("Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) Loaded:", apiKeyFromEnv ? "Yes" : "NO or EMPTY");
}

if (!apiKeyFromEnv) {
  if (typeof window !== 'undefined') {
      console.error(
        "CRITICAL Firebase Config Error: NEXT_PUBLIC_FIREBASE_API_KEY is missing or empty. " +
        "Firebase SDK cannot initialize correctly. " +
        "Please ensure this variable is set in your .env file and RESTART your Next.js development server if you recently added it."
      );
  }
}

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') console.log("Firebase App Initialized (New Instance). Project ID:", firebaseConfig.projectId);
} else {
  app = getApp();
  if (typeof window !== 'undefined') console.log("Firebase App Re-initialized (Existing Instance). Project ID:", firebaseConfig.projectId);
}

const auth: Auth = getAuth(app);
if (typeof window !== 'undefined') console.log("Firebase Authentication Initialized.");

const db: Firestore = getFirestore(app);
if (typeof window !== 'undefined') console.log("Firebase Firestore Initialized.");

const storage: FirebaseStorage = getStorage(app);
if (typeof window !== 'undefined') console.log("Firebase Storage Initialized.");

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
      console.log("Firebase Analytics Initialized (Measurement ID:", firebaseConfig.measurementId, ").");
    } else {
        if (!supported) console.log("Firebase Analytics: Not supported in this environment.");
        if (!firebaseConfig.measurementId) console.log("Firebase Analytics: Measurement ID (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) is missing. Analytics not initialized.");
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
