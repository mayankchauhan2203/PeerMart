import { createContext, useContext, useEffect, useState } from "react";
import {
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updatePassword,
  sendPasswordResetEmail,
  EmailAuthProvider,
  reauthenticateWithCredential
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, deleteDoc, onSnapshot } from "firebase/firestore";
import toast from "react-hot-toast";

const AuthContext = createContext();

// Add your admin emails here
const ADMIN_EMAILS = ["mayank@iitd.ac.in", "admin@iitd.ac.in", "pushkin@iitd.ac.in"];

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
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

  async function registerWithPassword(email, password, name) {
    if (!email.endsWith("@iitd.ac.in")) {
      return { success: false, error: "not-iitd" };
    }
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: error.message };
    }
  }

  async function loginWithPassword(email, password) {
    if (!email.endsWith("@iitd.ac.in")) {
      return { success: false, error: "not-iitd" };
    }
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  }

  async function resetPassword(email) {
    if (!email) return { success: false, error: "Email required" };
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
      return { success: true };
    } catch (error) {
      toast.error(error.message);
      return { success: false, error: error.message };
    }
  }

  async function changeUserPassword(oldPassword, newPassword) {
    if (!currentUser) return { success: false, error: "No user" };
    try {
      // Re-authenticate user to fulfill the "recent login" requirement seamlessly
      const credential = EmailAuthProvider.credential(currentUser.email, oldPassword);
      await reauthenticateWithCredential(currentUser, credential);
      
      // Now update the password
      await updatePassword(currentUser, newPassword);
      toast.success("Password updated successfully!");
      return { success: true };
    } catch (error) {
      console.error("Password update error:", error);
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        toast.error("Incorrect current password.");
      } else if (error.code === 'auth/too-many-requests') {
        toast.error("Too many failed attempts. Try again later.");
      } else {
        toast.error(error.message);
      }
      return { success: false, error: error.message };
    }
  }

  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Validate IITD domain & verification state dynamically
      if (user) {
        if (!user.email.endsWith("@iitd.ac.in")) {
          signOut(auth);
          setCurrentUser(null);
          setUserData(null);
          // } else if (!user.emailVerified) {
          //   // If they are cached as logged in but never verified
          //   setCurrentUser(null);
        } else {
          setCurrentUser(user);
          setIsAdmin(ADMIN_EMAILS.includes(user.email?.toLowerCase()));

          unsubUserDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
              setUserData(docSnap.data());
            } else {
              setUserData(null);
            }
          });
        }
      } else {
        setCurrentUser(null);
        setIsAdmin(false);
        setUserData(null);
        if (unsubUserDoc) unsubUserDoc();
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
      if (unsubUserDoc) unsubUserDoc();
    };
  }, []);



  const value = {
    currentUser,
    userData,
    isAdmin,
    sendMagicLink,
    verifyMagicLink,
    isMagicLink,
    registerWithPassword,
    loginWithPassword,
    changeUserPassword,
    resetPassword,
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
