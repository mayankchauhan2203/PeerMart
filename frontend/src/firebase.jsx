import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBqXBg744HOowqgo1Vc6ve8oqFb9IY8BPE",
  authDomain: "peermart-7331c.firebaseapp.com",
  projectId: "peermart-7331c",
  storageBucket: "peermart-7331c.firebasestorage.app",
  messagingSenderId: "383735186843",
  appId: "1:383735186843:web:99d1aaf9b482a4df88cd3e",
  measurementId: "G-HHS3ZQ5DC7"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

