
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// TODO: Replace with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
// Ensure these details (especially projectId) EXACTLY match
// the Firebase project where you've set your Firestore security rules.
const firebaseConfig = {
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj", // Your provided API Key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com", // Replace YOUR_PROJECT_ID
  projectId: "YOUR_PROJECT_ID", // Replace YOUR_PROJECT_ID
  storageBucket: "YOUR_PROJECT_ID.appspot.com", // Replace YOUR_PROJECT_ID
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // Replace with your Messaging Sender ID
  appId: "YOUR_APP_ID", // Replace with your App ID
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Measurement ID
};

// Log the projectId to help with debugging connection issues
if (typeof window !== 'undefined') {
  console.log("Firebase SDK Initializing with Project ID:", firebaseConfig.projectId);
  if (firebaseConfig.projectId === "YOUR_PROJECT_ID") {
    console.warn("Firebase config is using placeholder values. Replace them in src/lib/firebase.ts with your actual project details.");
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
      console.warn("Firebase Analytics is not supported in this environment or measurementId is missing/placeholder.");
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
