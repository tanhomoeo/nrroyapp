
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// IMPORTANT: Ensure ALL these details (especially projectId) EXACTLY match
// the Firebase project where you've set your Firestore security rules.
const firebaseConfig = {
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj", // This was provided by you
  authDomain: "nrroyapp.firebaseapp.com",
  // databaseURL: "https://nrroyapp-default-rtdb.asia-southeast1.firebasedatabase.app", // Firestore typically doesn't use databaseURL for web SDK v9+
  projectId: "nrroyapp", // CRITICAL: Must match the project in Firebase Console
  storageBucket: "nrroyapp.appspot.com",
  messagingSenderId: "550385387960",
  appId: "1:550385387960:web:59ec369942f69e844ae74d",
  measurementId: "G-CZSB1FRQBL"
};

// Log the projectId to help with debugging connection issues
if (typeof window !== 'undefined') { // Ensure this runs only in the browser
  console.log("Firebase SDK Initializing with Project ID:", firebaseConfig.projectId);
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
    if (supported && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
        console.log("Firebase Analytics Initialized.");
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else if (firebaseConfig.measurementId) {
      console.warn("Firebase Analytics is not supported in this environment or measurementId is missing.");
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
