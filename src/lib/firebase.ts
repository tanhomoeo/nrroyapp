
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's NEW Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4N7z6jCbBohaQTgmC78dXz3GzsiONjHM",
  authDomain: "dr-nihar.firebaseapp.com",
  projectId: "dr-nihar",
  storageBucket: "dr-nihar.firebasestorage.app",
  messagingSenderId: "721559945328",
  appId: "1:721559945328:web:4e747e02632754eced74b5",
  measurementId: "G-0K3W0DKLJX"
};

// --- Firebase SDK Configuration Check ---
if (typeof window !== 'undefined') {
  console.log("====================================================================");
  console.log("Firebase SDK Configuration Check (src/lib/firebase.ts):");
  console.log("--------------------------------------------------------------------");
  console.log("Attempting to connect to Firebase project with this configuration:");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("API Key (first 5 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "NOT SET");
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("Storage Bucket:", firebaseConfig.storageBucket);
  console.log("Messaging Sender ID:", firebaseConfig.messagingSenderId);
  console.log("App ID:", firebaseConfig.appId);
  console.log("Measurement ID:", firebaseConfig.measurementId || "NOT SET");
  console.log("--------------------------------------------------------------------");
  console.log("ACTION REQUIRED: Please METICULOUSLY verify these values against your Firebase project settings in the Firebase Console (console.firebase.google.com) for the project ID '" + firebaseConfig.projectId + "'. They MUST match exactly.");
  console.log("Ensure your Firestore security rules (firestore.rules) are published to THIS SAME project ID ('" + firebaseConfig.projectId + "').");
  console.log("====================================================================");

  if (firebaseConfig.projectId !== "dr-nihar") {
    console.error("CRITICAL ERROR: 'projectId' in src/lib/firebase.ts does NOT match 'dr-nihar'. This is likely the cause of permission errors if rules are set on 'dr-nihar'.");
    alert("CRITICAL Firebase Configuration Error: 'projectId' in src/lib/firebase.ts does not match 'dr-nihar'. Please check the developer console (F12) for details and update src/lib/firebase.ts if this is not intended.");
  }
}

// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics initialized for measurement ID:", firebaseConfig.measurementId);
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else if (supported && !firebaseConfig.measurementId) {
        console.warn("Firebase Analytics is supported, but no 'measurementId' was provided in firebaseConfig. Analytics will not be initialized.");
    } else {
        console.warn("Firebase Analytics is not supported by this browser or environment.");
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
  analytics,
  firebaseConfig // Exporting config for easy access in test page
};
