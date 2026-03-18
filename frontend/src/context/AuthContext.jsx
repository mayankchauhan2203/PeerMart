import { createContext, useContext, useEffect, useState } from "react";
import { 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink
} from "firebase/auth";
import { auth, db, storage } from "../firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { ref, deleteObject } from "firebase/storage";
import toast from "react-hot-toast";

const AuthContext = createContext();

// Add your admin emails here
const ADMIN_EMAILS = ["admin@iitd.ac.in", "cmaya@iitd.ac.in"];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  async function sendMagicLink(email) {
    if (!email.endsWith("@iitd.ac.in")) {
      return { success: false, error: "not-iitd" };
    }

    const actionCodeSettings = {
      url: window.location.origin + '/login',
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      return { success: true };
    } catch (error) {
      console.error("Magic link error:", error);
      return { success: false, error: error.message };
    }
  }

  async function verifyMagicLink(email, url) {
    try {
      if (isSignInWithEmailLink(auth, url)) {
        const result = await signInWithEmailLink(auth, email, url);
        window.localStorage.removeItem('emailForSignIn');
        return { success: true, user: result.user };
      }
      return { success: false, error: "invalid-link" };
    } catch (error) {
      console.error("Magic link verification error:", error);
      return { success: false, error: error.message };
    }
  }

  function isMagicLink(url) {
    return isSignInWithEmailLink(auth, url);
  }

  function logout() {
    return signOut(auth);
  }

  async function deleteAccount() {
    if (!currentUser) return { success: false, error: "No active user" };
    
    // 1. Delete Firestore user document (Best effort)
    try {
      const userDocRef = doc(db, "users", currentUser.uid);
      await deleteDoc(userDocRef);
    } catch (e) {
      console.warn("Could not delete Firestore doc (likely security rules):", e);
    }
    
    // 2. Delete Profile Photo from Storage (Best effort)
    try {
      const photoRef = ref(storage, `avatars/${currentUser.uid}`);
      await deleteObject(photoRef);
    } catch (e) {
      console.warn("Could not delete Storage avatar:", e);
    }

    // 3. Delete Auth Account
    try {
      await deleteUser(currentUser);
      
      toast.success("Account deleted successfully. We're sorry to see you go!");
      return { success: true };
    } catch (error) {
      console.error("Auth deletion error:", error);
      if (error.code === 'auth/requires-recent-login') {
        toast.error("For security, you must have logged in recently to delete your account. Redirecting...");
        await signOut(auth); // Force log out
        return { success: false, error: "requires-recent-login", forceLogout: true };
      } else {
        toast.error(`Failed to delete account: ${error.message}`);
      }
      return { success: false, error: error.message };
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Validate IITD domain & verification state dynamically
      if (user) {
        if (!user.email.endsWith("@iitd.ac.in")) {
          signOut(auth);
          setCurrentUser(null);
        // } else if (!user.emailVerified) {
        //   // If they are cached as logged in but never verified
        //   setCurrentUser(null);
        } else {
          setCurrentUser(user);
          setIsAdmin(ADMIN_EMAILS.includes(user.email));
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);



  const value = {
    currentUser,
    isAdmin,
    sendMagicLink,
    verifyMagicLink,
    isMagicLink,
    logout,
    deleteAccount,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
