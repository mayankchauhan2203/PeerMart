import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { FileText, Shield, Users, ChevronRight, AlertTriangle } from "lucide-react";

function TermsGate() {
  const { currentUser, userData, loading } = useAuth();
  const navigate = useNavigate();

  // If user has already accepted, redirect them away
  useEffect(() => {
    if (!loading && currentUser && userData?.termsAccepted === true) {
      navigate("/marketplace", { replace: true });
    }
    if (!loading && !currentUser) {
      navigate("/login", { replace: true });
    }
  }, [currentUser, userData, loading, navigate]);

  async function handleAccept() {
    try {
      await updateDoc(doc(db, "users", currentUser.uid), { termsAccepted: true });
      navigate("/marketplace", { replace: true });
    } catch (err) {
      console.error("Failed to save terms acceptance:", err);
    }
  }

  if (loading || !currentUser) return null;

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "var(--space-xl)",
      background: "var(--bg-primary)",
    }}>
      {/* Brand header */}
      <div style={{ marginBottom: "var(--space-2xl)", textAlign: "center" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, letterSpacing: "-0.5px" }}>
          <span className="gradient-text">PeerMart</span>
        </div>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "6px" }}>
          Welcome! Before you get started, please review our Terms of Service.
        </p>
      </div>

      {/* Gate warning banner */}
      <div style={{
        display: "flex",
        gap: "12px",
        alignItems: "flex-start",
        background: "rgba(244, 163, 0, 0.07)",
        border: "1px solid rgba(244, 163, 0, 0.3)",
        borderRadius: "var(--radius-md)",
        padding: "var(--space-md) var(--space-lg)",
        marginBottom: "var(--space-xl)",
        maxWidth: "700px",
        width: "100%",
      }}>
        <AlertTriangle size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: "2px" }} />
        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          You must accept the Terms of Service to continue using PeerMart. Please read the terms below carefully.
        </p>
      </div>

      {/* Terms content card */}
      <div style={{
        maxWidth: "700px",
        width: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-2xl)",
        marginBottom: "var(--space-xl)",
        maxHeight: "460px",
        overflowY: "auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-xl)" }}>
          <FileText size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, fontSize: "20px", color: "var(--text-primary)" }}>Terms of Service</h2>
        </div>

        {[
          {
            title: "1. Platform Liability Disclaimer",
            body: "PeerMart is a peer-to-peer connection board designed to facilitate transactions within the campus community. When an item is reserved, contact details are shared directly between the buyer and seller. PeerMart acts solely as a discovery platform and assumes no liability for the quality, safety, legality, or descriptions of items listed by users. All physical transactions happen independently of the platform."
          },
          {
            title: "2. User Eligibility",
            body: "Access to PeerMart is restricted to verified IITD students. You must register using your IITD institutional login. You are responsible for maintaining the confidentiality of your account credentials."
          },
          {
            title: "3. Appropriate Conduct",
            body: "Users agree not to list illegal items, counterfeit goods, hazardous materials, or explicit content. Malicious behavior — including repeatedly reserving items without showing up (flaking) or submitting false reports — will result in account restriction."
          },
          {
            title: "4. Reservation Fees",
            body: "Reserving an item requires a non-refundable platform fee of 3% of the item price, capped at a maximum of ₹30. This fee is processed securely through Razorpay and covers the cost of running the platform."
          },
          {
            title: "5. Account Termination",
            body: "Administrators reserve the right to suspend or terminate accounts, block users, or remove listings at any time, with or without prior notice, if these terms are violated."
          },
        ].map((section, i) => (
          <div key={i} style={{ marginBottom: "var(--space-xl)" }}>
            <h3 style={{ color: "var(--text-primary)", marginBottom: "8px", fontSize: "15px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px" }}>{section.title}</h3>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, fontSize: "14px" }}>{section.body}</p>
          </div>
        ))}
      </div>

      {/* Accept button */}
      <button onClick={handleAccept} className="btn btn-primary" style={{ fontSize: "16px", padding: "14px 48px", display: "flex", alignItems: "center", gap: "10px" }}>
        <Shield size={18} /> Accept &amp; Continue to PeerMart
        <ChevronRight size={16} />
      </button>
      <p style={{ marginTop: "var(--space-md)", fontSize: "12px", color: "var(--text-muted)" }}>
        By clicking Accept, you agree to abide by all terms above.
      </p>
    </div>
  );
}

export default TermsGate;
