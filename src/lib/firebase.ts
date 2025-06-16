
// Import the functions you need from the Firebase SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
// Import Firebase services you will use
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, type Analytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyApdat8HDcEQzxt-vDaMvUA41uY4F8fWI8",
  authDomain: "nrroyapp.firebaseapp.com",
  databaseURL: "https://nrroyapp-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "nrroyapp",
  storageBucket: "nrroyapp.appspot.com", // Corrected from firebasestorage.app to appspot.com
  messagingSenderId: "550385387960",
  appId: "1:550385387960:web:59ec369942f69e844ae74d",
  measurementId: "G-CZSB1FRQBL"
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
  isSupported().then((supported) => {
    if (supported && firebaseConfig.measurementId) {
      analytics = getAnalytics(app);
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
