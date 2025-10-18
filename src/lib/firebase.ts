// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBhe2N11sLwFEuKzHjDpAYWq1HIywDBYI0",
  authDomain: "maqsadm-206e8.firebaseapp.com",
  projectId: "maqsadm-206e8",
  storageBucket: "maqsadm-206e8.appspot.com",
  messagingSenderId: "313104144997",
  appId: "1:313104144997:web:34bf2eca189bb9879c048c",
  measurementId: "G-8HXP18G256"
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let auth: Auth;

if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

db = getFirestore(app);
auth = getAuth(app);


export { app, db, auth };
