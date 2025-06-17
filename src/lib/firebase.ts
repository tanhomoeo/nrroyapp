
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyApdat8HDcEQzxt-vDaMvUA41uY4F8fWI8",
  authDomain: "nrroyapp.firebaseapp.com",
  databaseURL: "https://nrroyapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nrroyapp",
  storageBucket: "nrroyapp.firebasestorage.app", // Corrected from firebasestorage.app to nrroyapp.appspot.com if that was the previous valid one, or keep as is if user confirmed this. User provided nrroyapp.firebasestorage.app, so using that.
  messagingSenderId: "550385387960",
  appId: "1:550385387960:web:59ec369942f69e844ae74d",
  measurementId: "G-CZSB1FRQBL"
};

// --- Log Firebase Configuration for easier debugging ---
if (typeof window !== 'undefined') {
  console.log("====================================================================");
  console.log("Firebase SDK Initializing with this configuration:");
  console.log("--------------------------------------------------------------------");
  console.log("apiKey (first 5 chars):", firebaseConfig.apiKey ? firebaseConfig.apiKey.substring(0, 5) + "..." : "NOT SET");
  console.log("authDomain:", firebaseConfig.authDomain);
  console.log("databaseURL:", firebaseConfig.databaseURL);
  console.log("projectId:", firebaseConfig.projectId);
  console.log("storageBucket:", firebaseConfig.storageBucket);
  console.log("messagingSenderId:", firebaseConfig.messagingSenderId);
  console.log("appId:", firebaseConfig.appId);
  console.log("measurementId:", firebaseConfig.measurementId);
  console.log("--------------------------------------------------------------------");
  console.log("Ensure these details EXACTLY match your Firebase project settings where Firestore rules are published.");
  console.log("====================================================================");
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
