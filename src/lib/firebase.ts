
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// IMPORTANT: It's highly recommended to use environment variables for these values
// instead of hardcoding them, especially for the API key.
// Example using environment variables (requires .env.local file and process.env.NEXT_PUBLIC_... prefix):
// const firebaseConfig = {
//   apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
//   authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
//   projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
//   storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
//   messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
//   appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
//   measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID, // Optional
// };

const firebaseConfig = {
  apiKey: "AIzaSyApdat8HDcEQzxt-vDaMvUA41uY4F8fWI8",
  authDomain: "nrroyapp.firebaseapp.com",
  databaseURL: "https://nrroyapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nrroyapp",
  storageBucket: "nrroyapp.appspot.com", // Corrected to .appspot.com standard
  messagingSenderId: "550385387960",
  appId: "1:550385387960:web:59ec369942f69e844ae74d",
  measurementId: "G-CZSB1FRQBL" // Optional, but included if you use Analytics
};


// Initialize Firebase
let app: FirebaseApp;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') console.log("Firebase App Initialized (New Instance). Project ID:", firebaseConfig.projectId);
} else {
  app = getApp();
  if (typeof window !== 'undefined') console.log("Firebase App Re-initialized (Existing Instance). Project ID:", firebaseConfig.projectId);
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

let analytics: Analytics | undefined;
if (typeof window !== 'undefined') {
  // Check if analytics is supported by the browser and measurementId is present
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics Initialized.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else if (firebaseConfig.measurementId) {
      console.warn("Firebase Analytics is not supported in this environment or measurementId is missing.");
    } else {
      // console.log("Firebase Analytics not configured (no measurementId).");
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
