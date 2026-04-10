import { useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { MessageSquare, Send, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

function Feedback() {
  const { currentUser, userData } = useAuth();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, "userFeedback"), {
        userId: currentUser?.uid || null,
        userName: userData?.name || currentUser?.displayName || "Anonymous",
        userEmail: userData?.email || currentUser?.email || "",
        message: message.trim(),
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="marketplace" style={{ maxWidth: "680px", margin: "0 auto", minHeight: "calc(100vh - 80px)" }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          Share Your <span className="gradient-text">Feedback</span>
        </h1>
        <p>Help us improve PeerMart by sharing your thoughts, ideas, or experiences.</p>
      </div>

      {submitted ? (
        <div style={{
          textAlign: "center", padding: "var(--space-2xl)",
          background: "var(--bg-card)", borderRadius: "var(--radius-lg)",
          border: "1px solid rgba(74,222,128,0.25)"
        }}>
          <div style={{ width: "72px", height: "72px", margin: "0 auto 1.5rem", borderRadius: "50%", background: "rgba(74,222,128,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={36} color="#4ade80" />
          </div>
          <h2 style={{ color: "var(--text-primary)", marginBottom: "0.75rem" }}>Thanks for your feedback!</h2>
          <p style={{ color: "var(--text-secondary)" }}>Your message has been sent to the PeerMart team. We appreciate you taking the time to share your thoughts.</p>
          <button className="btn btn-primary" style={{ marginTop: "var(--space-xl)", display: "inline-flex" }} onClick={() => { setMessage(""); setSubmitted(false); }}>
            Submit More Feedback
          </button>
        </div>
      ) : (
        <div style={{ background: "var(--bg-card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-subtle)", padding: "var(--space-2xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-xl)", paddingBottom: "var(--space-md)", borderBottom: "1px solid var(--border-subtle)" }}>
            <div style={{ background: "rgba(244,163,0,0.1)", padding: "10px", borderRadius: "var(--radius-md)", color: "var(--accent-primary)" }}>
              <MessageSquare size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, color: "var(--text-primary)" }}>General Feedback</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-muted)" }}>Your feedback goes directly to the PeerMart team</p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: "var(--space-xl)" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: 600, fontSize: "14px", color: "var(--text-secondary)" }}>
                Your Feedback <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Share your experience, feature requests, issues you encountered, or anything else about PeerMart…"
                required
                rows={6}
                style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", background: "var(--bg-darker)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", fontSize: "14px", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="submit" className="btn btn-primary" disabled={submitting || !message.trim()} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {submitting ? "Submitting…" : <><Send size={16} /> Send Feedback</>}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default Feedback;
