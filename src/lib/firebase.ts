
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
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj",
  authDomain: "nrroyapp.firebaseapp.com",
  projectId: "nrroyapp",
  storageBucket: "nrroyapp.appspot.com",
  // CRITICAL: REPLACE THE NEXT TWO LINES WITH YOUR ACTUAL FIREBASE PROJECT VALUES
  messagingSenderId: "REPLACE_WITH_YOUR_ACTUAL_MESSAGING_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_ACTUAL_APP_ID",
  // Optional: Replace if you use Analytics, otherwise, it can be removed or left as placeholder
  measurementId: "REPLACE_WITH_YOUR_MEASUREMENT_ID_IF_USING_ANALYTICS"
};

// --- CRITICAL DIAGNOSTIC LOG ---
if (typeof window !== 'undefined') {
  console.log("====================================================================");
  console.log("!!! Firebase SDK Configuration Check !!!");
  console.log("Firebase App is attempting to initialize with this configuration:");
  console.log("--------------------------------------------------------------------");
  console.log("apiKey (first 5 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "NOT SET");
  console.log("authDomain:", firebaseConfig.authDomain);
  console.log("projectId:", firebaseConfig.projectId);
  console.log("storageBucket:", firebaseConfig.storageBucket);
  console.log("messagingSenderId:", firebaseConfig.messagingSenderId); // This will show the placeholder if not replaced
  console.log("appId:", firebaseConfig.appId); // This will show the placeholder if not replaced
  console.log("measurementId:", firebaseConfig.measurementId);
  console.log("--------------------------------------------------------------------");
  console.log("ACTION REQUIRED: Please verify that ALL of the above values EXACTLY MATCH the settings for your Firebase project ('" + firebaseConfig.projectId + "') in the Firebase Console.");
  console.log("Go to Firebase Console -> Project settings (gear icon) -> General tab -> Your apps -> Firebase SDK snippet (Config).");

  if (firebaseConfig.messagingSenderId === "REPLACE_WITH_YOUR_ACTUAL_MESSAGING_SENDER_ID" ||
      firebaseConfig.appId === "REPLACE_WITH_YOUR_ACTUAL_APP_ID") {
    console.error("CRITICAL ERROR: 'messagingSenderId' or 'appId' in src/lib/firebase.ts are still set to placeholder values. You MUST replace them with the actual values from your Firebase project settings for the app to connect correctly.");
    alert("CRITICAL Firebase Configuration Error: 'messagingSenderId' or 'appId' are not set. Please check the developer console (F12) for details and update src/lib/firebase.ts.");
  }
  if (firebaseConfig.projectId !== "nrroyapp") {
     console.warn("WARNING: The projectId in firebase.ts ('" + firebaseConfig.projectId + "') does not match 'nrroyapp'. If 'nrroyapp' is your intended project, please correct this.");
  }
  console.log("====================================================================");
}
// --- END CRITICAL DIAGNOSTIC LOG ---

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
    if (supported && firebaseConfig.measurementId && firebaseConfig.measurementId !== "REPLACE_WITH_YOUR_MEASUREMENT_ID_IF_USING_ANALYTICS") {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        console.error("Error initializing Firebase Analytics:", error);
      }
    } else if (firebaseConfig.measurementId === "REPLACE_WITH_YOUR_MEASUREMENT_ID_IF_USING_ANALYTICS") {
        // console.warn("Firebase Analytics: measurementId is a placeholder. Analytics will not be initialized.");
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
