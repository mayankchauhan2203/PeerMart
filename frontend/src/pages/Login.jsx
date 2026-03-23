import { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Shield, Mail, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";
import { updateProfile } from "firebase/auth";

function Login() {
  const { sendMagicLink, verifyMagicLink, isMagicLink, currentUser, loginWithPassword, registerWithPassword, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if coming from email link
    // MAGIC LINK LOGIC COMMENTED OUT FOR TESTING
    /*
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
    */
  }, [isMagicLink, verifyMagicLink, navigate, location.state]);

  async function handleForgotPassword() {
    if (!email.endsWith("@iitd.ac.in")) {
      toast.error("Please enter your @iitd.ac.in email address first.");
      return;
    }
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
  }

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
      if (password.length < 6) {
        toast.error("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }

      const result = await registerWithPassword(email, password, name.trim());
      if (!result.success) {
        toast.error(result.error === "not-iitd" ? "You must use an @iitd.ac.in email." : result.error);
      } else {
        toast.success("Account created! Logging in...");
        const from = location.state?.from?.pathname || "/marketplace";
        navigate(from, { replace: true });
      }
    } else {
      const result = await loginWithPassword(email, password);
      if (!result.success) {
        toast.error(result.error === "not-iitd" ? "You must use an @iitd.ac.in email." : "Invalid credentials.");
      } else {
        toast.success("Successfully logged in!");
        const from = location.state?.from?.pathname || "/marketplace";
        navigate(from, { replace: true });
      }
    }

    /* MAGIC LINK LOGIC COMMENTED OUT FOR TESTING
    const result = await sendMagicLink(email);
    if (!result.success) {
      toast.error(result.error === "not-iitd" ? "You must use an @iitd.ac.in email." : "Failed to send link.");
    } else {
      toast.success("Login link sent! Please check your email.");
    }
    */

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
              Restricted to <code>@iitd.ac.in</code> emails only. Password login (Testing Mode).
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

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Password</label>
              {!isRegistering && (
                <button type="button" onClick={handleForgotPassword} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                  Forgot Password?
                </button>
              )}
            </div>
            <div className="input-with-icon">
              <Shield size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "Please wait..." : (isRegistering ? "Create Account" : "Sign In")}
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
