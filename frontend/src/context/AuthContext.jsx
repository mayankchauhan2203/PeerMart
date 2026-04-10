import { createContext, useContext, useEffect, useState } from "react";
import { signOut, onAuthStateChanged, deleteUser } from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, deleteDoc, onSnapshot, setDoc, query, collection, where, getDocs, updateDoc, deleteField } from "firebase/firestore";
import toast from "react-hot-toast";

const AuthContext = createContext();

// Admin emails — checked against Firestore email (works with custom token UIDs)
const ADMIN_EMAILS = ["mt6240676@maths.iitd.ac.in", "cs5240081@cse.iitd.ac.in"];

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
        response_type: "code",
        client_id: "42abb3bfcb640147e23d8f74609e9601",
        redirect_uri: `${window.location.origin}/auth/callback`,
        state: state,
        code_challenge: codeChallenge,
        code_challenge_method: "S256",
        scope: "openid profile email",
      });

      window.location.href = `https://auth.devclub.in/api/oauth/authorize?${params}`;
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
      // 1. Delete all active listings by the user
      const sellerQ = query(collection(db, "items"), where("sellerId", "==", currentUser.uid));
      const sellerDocs = await getDocs(sellerQ);
      await Promise.all(sellerDocs.docs.map(d => deleteDoc(d.ref)));

      // 2. Cancel all reservations made by the user
      const reserveQ = query(collection(db, "items"), where("reservedBy", "==", currentUser.uid));
      const reserveDocs = await getDocs(reserveQ);
      await Promise.all(reserveDocs.docs.map(d => updateDoc(d.ref, {
        status: "available",
        reservedBy: deleteField(),
        reservedByName: deleteField(),
        reservedByEmail: deleteField(),
        reservedAt: deleteField(),
      })));

      // 3. Delete any reports made by this user
      const reportQ = query(collection(db, "reports"), where("reporterId", "==", currentUser.uid));
      const reportDocs = await getDocs(reportQ);
      await Promise.all(reportDocs.docs.map(d => deleteDoc(d.ref)));

      // 4. Delete any notifications targeted for this user
      const notifyQ = query(collection(db, "notifications"), where("recipientId", "==", currentUser.uid));
      const notifyDocs = await getDocs(notifyQ);
      await Promise.all(notifyDocs.docs.map(d => deleteDoc(d.ref)));

      // 5. Delete the main user document
      await deleteDoc(doc(db, "users", currentUser.uid));
    } catch (e) {
      console.warn("Could not selectively delete cascaded Firestore documents:", e);
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

        // Keep a minimal Firestore doc in sync (uid always present).
        // Only write fields that are actually present on the Firebase Auth object
        // to avoid overwriting richer IITD profile data saved during IITDCallback.
        const upsertData = { uid: user.uid };
        // Custom-token users have no email/displayName on the Auth object itself —
        // those come from IITD userinfo and are written by IITDCallback.
        // Only include them here when they are non-empty.
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
