// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// These values are hardcoded to ensure they are always available on the client-side.
const firebaseConfig = {
  apiKey: "AIzaSyBhe2N11sLwFEuKzHjDpAYWq1HIywDBYI0",
  authDomain: "maqsadm-206e8.firebaseapp.com",
  projectId: "maqsadm-206e8",
  storageBucket: "maqsadm-206e8.firebasestorage.app",
  messagingSenderId: "313104144997",
  appId: "1:313104144997:web:34bf2eca189bb9879c048c",
  measurementId: "G-8HXP18G256",
};

// Initialize Firebase
// Check if apps are already initialized to prevent errors
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
