import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShoppingBag, Shield, Mail, Lock, User as UserIcon } from "lucide-react";
import toast from "react-hot-toast";

function Login() {
  const { login, signup, currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
      
      const result = await signup(email, password, name);
      if (result.success) {
        // Switch to login mode so they can login after verifying
        setIsRegistering(false);
        setPassword("");
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        const from = location.state?.from?.pathname || "/marketplace";
        navigate(from, { replace: true });
      }
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
          <h1>{isRegistering ? "Create Account" : "Welcome Back"}</h1>
        </div>

        <div className="login-alert" style={{ marginBottom: 'var(--space-xl)', padding: 'var(--space-md)' }}>
          <Shield size={18} className="alert-icon" />
          <div className="alert-text">
            <p style={{ margin: 0, fontSize: '0.85rem' }}>
              Restricted to <code>@iitd.ac.in</code> emails only.
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
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn" 
            disabled={loading}
            style={{ marginTop: 'var(--space-xl)', background: 'var(--accent-gradient)', color: '#fff', border: 'none' }}
          >
            {loading ? "Please wait..." : (isRegistering ? "Sign Up" : "Sign In")}
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
                setPassword("");
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
