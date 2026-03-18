import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBLen9BIPrWbKa6cdqrqQoHASDMUkw9XcM",
  authDomain: "peermart-17ed2.firebaseapp.com",
  projectId: "peermart-17ed2",
  storageBucket: "peermart-17ed2.firebasestorage.app",
  messagingSenderId: "772937250769",
  appId: "1:772937250769:web:d58d7484906489b4f752f0",
  measurementId: "G-6L1MKL26L6"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);