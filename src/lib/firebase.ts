
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
// See: https://firebase.google.com/docs/web/setup#config-object
// Example using environment variables (you would set these in your hosting environment):
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
// };

// TODO: Replace with your app's Firebase project configuration
// Ensure these details EXACTLY match the Firebase project where your Firestore rules are set.
const firebaseConfig = {
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj", // Your provided API Key
  authDomain: "nrroyapp.firebaseapp.com", // Replace with YOUR_PROJECT_ID.firebaseapp.com
  projectId: "nrroyapp", // Replace with YOUR_PROJECT_ID
  storageBucket: "nrroyapp.appspot.com", // Replace with YOUR_PROJECT_ID.appspot.com
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
  appId: "YOUR_APP_ID", // Replace with your App ID
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Measurement ID
};

// Log the projectId to help with debugging connection issues
if (typeof window !== 'undefined') {
  console.log("Firebase SDK Initializing with Project ID:", firebaseConfig.projectId);
  if (firebaseConfig.projectId === "YOUR_PROJECT_ID" || firebaseConfig.projectId === "nrroyapp" && firebaseConfig.authDomain.includes("YOUR_PROJECT_ID")) {
    console.warn("Firebase config might be using placeholder values (YOUR_PROJECT_ID). Please replace them in src/lib/firebase.ts with your actual Firebase project details for all fields.");
  }
}

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
    } else if (firebaseConfig.measurementId && firebaseConfig.measurementId !== "YOUR_MEASUREMENT_ID") {
      // Warning already covered by the projectId check, or analytics simply not used.
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
