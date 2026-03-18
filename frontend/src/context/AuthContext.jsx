import { createContext, useContext, useEffect, useState } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth } from "../firebase";
import toast from "react-hot-toast";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name) {
    if (!email.endsWith("@iitd.ac.in")) {
      return { success: false, error: "not-iitd" };
    }

    try {
      // Create account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Add name to profile
      await updateProfile(result.user, { displayName: name });
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      // Sign out immediately so they are forced to verify before entering the app
      // await signOut(auth);
      
      toast.success("Account created successfully! You are now logged in.");
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error("This email is already registered.");
      } else {
        toast.error("Failed to create account. Try a stronger password.");
      }
      return { success: false, error: error.message };
    }
  }

  async function login(email, password) {
    if (!email.endsWith("@iitd.ac.in")) {
      return { success: false, error: "not-iitd" };
    }

    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Check if email is verified
      // TEMPORARILY DISABLED: IITD emails often block automated Firebase verification emails
      // if (!result.user.emailVerified) {
      //   await signOut(auth);
      //   toast.error("Please verify your email address before logging in.");
      //   return { success: false, error: "unverified" };
      // }

      toast.success("Successfully logged in!");
      return { success: true };
    } catch (error) {
      toast.error("Invalid email or password.");
      return { success: false, error: error.message };
    }
  }

  function logout() {
    return signOut(auth);
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
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    signup,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
