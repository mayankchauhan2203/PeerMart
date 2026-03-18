import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Shield, Mail, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { updateProfile } from "firebase/auth";

function Login() {
  const { sendMagicLink, verifyMagicLink, isMagicLink, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if coming from email link
    if (isMagicLink(window.location.href)) {
      let emailForSignIn = window.localStorage.getItem('emailForSignIn');
      if (!emailForSignIn) {
        emailForSignIn = window.prompt("Please provide your email for confirmation");
      }
      
      if (emailForSignIn) {
        setLoading(true);
        verifyMagicLink(emailForSignIn, window.location.href)
          .then(async (result) => {
            if (result.success) {
              const savedName = window.localStorage.getItem('nameForSignIn');
              if (savedName && result.user) {
                try {
                  await updateProfile(result.user, { displayName: savedName });
                } catch (e) {
                  console.error(e);
                }
              }
              // Toast is mostly handled in verifyMagicLink, but we can do it here too just in case
              toast.success("Successfully logged in!");
              window.localStorage.removeItem('nameForSignIn');
              const from = location.state?.from?.pathname || "/marketplace";
              navigate(from, { replace: true });
            } else {
              setLoading(false);
            }
          });
      }
    }
  }, [isMagicLink, verifyMagicLink, navigate, location.state]);

  // If already logged in, redirect away
  if (currentUser) {
    const from = location.state?.from?.pathname || "/marketplace";
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.endsWith("@iitd.ac.in")) {
      toast.error("You must use an @iitd.ac.in email address.");
      return;
    }

    setLoading(true);

    if (isRegistering) {
      if (!name.trim()) {
        toast.error("Please enter your name.");
        setLoading(false);
        return;
      }
      window.localStorage.setItem('nameForSignIn', name.trim());
    }

    const result = await sendMagicLink(email);
    if (!result.success) {
      toast.error(result.error === "not-iitd" ? "You must use an @iitd.ac.in email." : "Failed to send link.");
    } else {
      toast.success("Login link sent! Please check your email.");
    }

    setLoading(false);
  }

  return (
    <div className="login-page">
      <div className="login-card" style={{ maxWidth: '420px' }}>
        <div className="login-brand" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="brand-icon-large">
            <ShoppingBag size={32} color="white" />
          </div>
          <h1>{isRegistering ? "Create Account" : "Access PeerMart"}</h1>
        </div>

        <div className="login-alert" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-md)' }}>
          <Shield size={18} className="alert-icon" />
          <div className="alert-text">
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Restricted to <code>@iitd.ac.in</code> emails only. Passwordless login.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <UserIcon size={18} className="input-icon" />
                <input 
                  type="text" 
                  placeholder="Student Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>IITD Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                placeholder="email@iitd.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
            style={{ marginTop: 'var(--space-xl)', background: 'var(--accent-gradient)', color: '#fff', border: 'none' }}
          >
            {loading ? "Please wait..." : "Send Magic Link"}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isRegistering ? "Already have an account?" : "New to PeerMart?"}
            <button 
              type="button" 
              className="toggle-btn"
              onClick={() => {
                setIsRegistering(!isRegistering);
              }}
            >
              {isRegistering ? "Sign In" : "Create Account"}
            </button>
          </p>
        </div>
      </div>

      <div className="hero-bg" style={{ pointerEvents: 'none', position: 'fixed', zIndex: -1 }}>
        <div className="hero-blob hero-blob-1"></div>
        <div className="hero-blob hero-blob-2"></div>
      </div>
    </div>
  );
}

export default Login;
