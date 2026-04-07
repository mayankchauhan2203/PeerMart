import { createContext, useContext, useEffect, useState } from "react";
import { signOut, onAuthStateChanged, deleteUser, updateProfile } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, deleteDoc, onSnapshot, setDoc } from "firebase/firestore";
import toast from "react-hot-toast";

const AuthContext = createContext();

// Admin emails — checked against Firestore email (works with custom token UIDs)
const ADMIN_EMAILS = ["mayank@iitd.ac.in", "admin@iitd.ac.in", "pushkin@iitd.ac.in"];

export function useAuth() {
  return useContext(AuthContext);
}

// ── PKCE helpers ──────────────────────────────────────────────────────────────
function base64UrlEncode(array) {
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // ── Initiate IITD OAuth 2.0 + PKCE flow ──────────────────────────────────
  async function loginWithIITD() {
    try {
      // 1. Generate PKCE code_verifier
      const verifierBytes = new Uint8Array(32);
      crypto.getRandomValues(verifierBytes);
      const codeVerifier = base64UrlEncode(verifierBytes);

      // 2. Compute code_challenge = BASE64URL(SHA256(code_verifier))
      const encoder = new TextEncoder();
      const digest = await crypto.subtle.digest(
        "SHA-256",
        encoder.encode(codeVerifier)
      );
      const codeChallenge = base64UrlEncode(new Uint8Array(digest));

      // 3. Generate random state (CSRF protection)
      const stateBytes = new Uint8Array(16);
      crypto.getRandomValues(stateBytes);
      const state = base64UrlEncode(stateBytes);

      // 4. Persist in sessionStorage
      sessionStorage.setItem("pkce_code_verifier", codeVerifier);
      sessionStorage.setItem("oauth_state", state);

      // 5. Redirect to IITD authorize endpoint (Modern API)
      const params = new URLSearchParams({
        response_type:         "code",
        client_id:             "42abb3bfcb640147e23d8f74609e9601",
        redirect_uri:          `${window.location.origin}/auth/callback`,
        state:                 state,
        code_challenge:        codeChallenge,
        code_challenge_method: "S256",
      });

      // Passing scope as an empty string or omitting it entirely to avoid the generic IITD form crash
      // params.append("scope", "openid");

      window.location.href = `https://oauth.iitd.ac.in/api/oauth/authorize?${params}`;
    } catch (err) {
      console.error("[loginWithIITD] Failed:", err);
      toast.error("Failed to start IITD login. Please try again.");
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function logout() {
    return signOut(auth);
  }

  // ── Delete account ────────────────────────────────────────────────────────
  async function deleteAccount() {
    if (!currentUser) return { success: false, error: "No active user" };

    try {
      await deleteDoc(doc(db, "users", currentUser.uid));
    } catch (e) {
      console.warn("Could not delete Firestore doc:", e);
    }

    try {
      await deleteUser(currentUser);
      toast.success("Account deleted successfully.");
      return { success: true };
    } catch (error) {
      console.error("Auth deletion error:", error);
      if (error.code === "auth/requires-recent-login") {
        toast.error("Please log in again before deleting your account.");
        await signOut(auth);
        return { success: false, error: "requires-recent-login", forceLogout: true };
      }
      toast.error(`Failed to delete account: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // ── Firebase Auth state listener ──────────────────────────────────────────
  useEffect(() => {
    let unsubUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user);

        // Keep a minimal Firestore doc in sync (uid always present)
        const upsertData = { uid: user.uid };
        if (user.displayName) upsertData.name = user.displayName;
        if (user.email) upsertData.email = user.email;

        setDoc(doc(db, "users", user.uid), upsertData, { merge: true }).catch(
          (e) => console.warn("Could not upsert user doc:", e)
        );

        // Real-time listener on Firestore user doc
        // isAdmin is derived from here so it works for custom-token users
        // (who may have no email on the Firebase Auth object itself)
        unsubUserDoc = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData(data);
            setIsAdmin(ADMIN_EMAILS.includes((data.email || "").toLowerCase()));
          } else {
            setUserData(null);
            setIsAdmin(false);
          }
        });
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
    isBlocked: !!userData?.blocked,
    loginWithIITD,
    logout,
    deleteAccount,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
