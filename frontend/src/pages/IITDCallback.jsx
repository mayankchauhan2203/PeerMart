import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithCustomToken, updateProfile } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import toast from "react-hot-toast";
import { ShoppingBag, CheckCircle, XCircle, Loader } from "lucide-react";

const STEPS = [
  "Verifying your IITD identity…",
  "Exchanging authorization code…",
  "Setting up your PeerMart account…",
  "Saving your profile…",
];

function IITDCallback() {
  const navigate = useNavigate();
  const [step, setStep] = useState(STEPS[0]);
  const [error, setError] = useState(null);

  useEffect(() => {
    handleCallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCallback() {
    try {
      const params = new URLSearchParams(window.location.search);
      const code       = params.get("code");
      const state      = params.get("state");
      const errorParam = params.get("error");

      // Handle IITD-side errors (e.g. user denied access)
      if (errorParam) {
        throw new Error(
          params.get("error_description") || `IITD OAuth error: ${errorParam}`
        );
      }

      if (!code || !state) {
        throw new Error("Missing authorization code or state parameter.");
      }

      // ── CSRF protection ───────────────────────────────────────────────────
      const savedState = sessionStorage.getItem("oauth_state");

      // Synchronously claim the verifier before any async work — this prevents
      // React StrictMode's double-invocation from sending the auth code twice.
      const codeVerifier = sessionStorage.getItem("pkce_code_verifier");
      if (!codeVerifier) return; // Already consumed by the first invocation
      sessionStorage.removeItem("pkce_code_verifier");

      if (!savedState || state !== savedState) {
        throw new Error("State mismatch — possible CSRF attack. Please try logging in again.");
      }

      // ── Step 1: Exchange code with backend ────────────────────────────────
      setStep(STEPS[1]);

      const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";
      const res = await fetch(`${API_URL}/api/auth/iitd/token`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ code, code_verifier: codeVerifier }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to exchange authorization code.");
      }

      const { customToken, userInfo } = data;

      if (!customToken) {
        throw new Error("Server did not return a Firebase token. Please try again.");
      }

      // ── Step 2: Sign into Firebase with custom token ──────────────────────
      setStep(STEPS[2]);

      const result = await signInWithCustomToken(auth, customToken);
      const firebaseUser = result.user;

      // Set display name on the Firebase Auth profile (used by Navbar avatar)
      if (userInfo.name) {
        await updateProfile(firebaseUser, { displayName: userInfo.name });
      }

      // ── Step 3: Upsert IITD user data into Firestore ──────────────────────
      setStep(STEPS[3]);

      const userRef  = doc(db, "users", firebaseUser.uid);
      const existing = await getDoc(userRef);

      await setDoc(
        userRef,
        {
          uid:          firebaseUser.uid,
          name:         userInfo.name         || "",
          email:        userInfo.email         || "",
          kerberos_id:  userInfo.kerberos_id   || "",
          entry_number: userInfo.entry_number  || "",
          department:   userInfo.department    || "",
          hostel:       userInfo.hostel        || "",
          category:     userInfo.category      || "",
          phone:        userInfo.phone         || "",
          lastLogin:    new Date().toISOString(),
          // Only set createdAt on first robust login
          ...((!existing.exists() || !existing.data()?.createdAt) && { createdAt: new Date().toISOString() }),
          // New users must accept terms before using the platform
          ...(!existing.exists() && { termsAccepted: false }),
        },
        { merge: true }
      );

      // ── Clean up sessionStorage ───────────────────────────────────────────
      const isNewUser = !existing.exists();
      const redirectTo = isNewUser
        ? "/terms-gate"
        : (sessionStorage.getItem("oauth_redirect_after") || "/marketplace");
      sessionStorage.removeItem("oauth_state");
      sessionStorage.removeItem("oauth_redirect_after");

      toast.success(`Welcome, ${userInfo.name?.split(" ")[0] || "IITD User"}! 🎉`);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      console.error("[IITDCallback] Error:", err);
      setError(err.message || "Authentication failed. Please try again.");
    }
  }

  // ── Error screen ──────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="login-page">
        <div className="login-card" style={{ maxWidth: "440px", textAlign: "center" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: "rgba(248, 113, 113, 0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <XCircle size={32} color="#f87171" />
            </div>
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.3rem" }}>
              Authentication Failed
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", lineHeight: 1.5, margin: 0 }}>
              {error}
            </p>
          </div>
          <button
            id="back-to-login-btn"
            className="login-btn"
            onClick={() => navigate("/login")}
            style={{ background: "var(--accent-gradient)", color: "#fff", border: "none" }}
          >
            Back to Login
          </button>
        </div>
        <div className="hero-bg" style={{ pointerEvents: "none", position: "fixed", zIndex: -1 }}>
          <div className="hero-blob hero-blob-1" />
          <div className="hero-blob hero-blob-2" />
        </div>
      </div>
    );
  }

  // ── Loading screen with step indicator ───────────────────────────────────
  const currentIdx = STEPS.indexOf(step);

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: "400px", textAlign: "center" }}>
        <div
          style={{
            width: "72px", height: "72px", borderRadius: "20px",
            background: "var(--accent-gradient)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 1.5rem",
            boxShadow: "0 8px 32px rgba(255,140,66,0.35)",
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          <ShoppingBag size={36} color="white" />
        </div>

        <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.25rem" }}>Signing you in…</h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "2rem" }}>
          {step}
        </p>

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "2rem" }}>
          <Loader
            size={28}
            color="var(--accent)"
            style={{ animation: "spin 1s linear infinite" }}
          />
        </div>

        {/* Step indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", textAlign: "left" }}>
          {STEPS.map((s, i) => {
            const isDone   = i < currentIdx;
            const isActive = i === currentIdx;
            return (
              <div
                key={s}
                style={{
                  display: "flex", alignItems: "center", gap: "0.75rem",
                  opacity: isDone || isActive ? 1 : 0.35,
                  fontSize: "0.8rem", transition: "opacity 0.3s",
                }}
              >
                {isDone ? (
                  <CheckCircle size={14} color="#4ade80" />
                ) : (
                  <div
                    style={{
                      width: "14px", height: "14px", borderRadius: "50%", flexShrink: 0,
                      border: `2px solid ${isActive ? "var(--accent)" : "var(--border-subtle)"}`,
                    }}
                  />
                )}
                <span style={{ color: isDone ? "#4ade80" : isActive ? "var(--text-primary)" : "var(--text-muted)" }}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hero-bg" style={{ pointerEvents: "none", position: "fixed", zIndex: -1 }}>
        <div className="hero-blob hero-blob-1" />
        <div className="hero-blob hero-blob-2" />
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default IITDCallback;
