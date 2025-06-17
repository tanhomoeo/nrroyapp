
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

const firebaseConfig = {
  apiKey: "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj", // YOUR PROVIDED API KEY
  authDomain: "nrroyapp.firebaseapp.com", // CRITICAL: Replace YOUR_PROJECT_ID with your actual Project ID
  projectId: "nrroyapp", // CRITICAL: Replace with your actual Firebase Project ID
  storageBucket: "nrroyapp.appspot.com", // CRITICAL: Replace YOUR_PROJECT_ID with your actual Project ID
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID", // CRITICAL: Replace with your Messaging Sender ID from Firebase Console
  appId: "YOUR_APP_ID", // CRITICAL: Replace with your App ID from Firebase Console
  measurementId: "YOUR_MEASUREMENT_ID" // Optional: Replace with your Measurement ID from Firebase Console
};

// --- CRITICAL DIAGNOSTIC LOG ---
// When your app loads in the browser, check the Developer Console.
// The Project ID logged here MUST EXACTLY MATCH the Project ID
// in the Firebase Console where you have set your Firestore Security Rules
// AND where your API Key is enabled.
if (typeof window !== 'undefined') {
  console.log("============================================================");
  console.log("Firebase SDK Initializing with Configuration:");
  console.log("Project ID:", firebaseConfig.projectId);
  console.log("Auth Domain:", firebaseConfig.authDomain);
  console.log("API Key (first 5 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "NOT SET");
  console.log("Ensure these details EXACTLY match your Firebase project settings.");
  console.log("============================================================");

  if (firebaseConfig.projectId === "YOUR_PROJECT_ID" ||
      firebaseConfig.authDomain.includes("YOUR_PROJECT_ID.firebaseapp.com") ||
      firebaseConfig.storageBucket.includes("YOUR_PROJECT_ID.appspot.com") ||
      firebaseConfig.messagingSenderId === "YOUR_MESSAGING_SENDER_ID" ||
      firebaseConfig.appId === "YOUR_APP_ID") {
    console.warn(
      "Firebase config in src/lib/firebase.ts appears to be using one or more placeholder values (like 'YOUR_PROJECT_ID', 'YOUR_MESSAGING_SENDER_ID', 'YOUR_APP_ID'). " +
      "Please replace ALL 'YOUR_...' placeholders with your actual Firebase project details for the application to work correctly. " +
      "The API key provided might be valid, but if other parameters point to a non-existent or different project, authentication will fail."
    );
  }
   if (firebaseConfig.apiKey === "avjaM8057XSBsNHxr78Ogc45ysDpJio14t6j7iHj" && firebaseConfig.projectId !== "nrroyapp") {
    console.warn(
        "The API key provided appears to be for the 'nrroyapp' project, but the projectId in firebaseConfig is different. " +
        "Ensure the API key and projectId are for the SAME Firebase project."
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
    } else if (supported && (!firebaseConfig.measurementId || firebaseConfig.measurementId === "YOUR_MEASUREMENT_ID")) {
        // console.log("Firebase Analytics is supported, but no measurementId is configured or it's a placeholder.");
    } else {
        // console.log("Firebase Analytics is not supported on this browser or environment.");
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
