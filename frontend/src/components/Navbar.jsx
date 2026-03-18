import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingBag, Home, Store, PlusCircle, User, LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="navbar-brand">
          <div className="brand-icon">
            <ShoppingBag size={20} color="white" />
          </div>
          <span className="gradient-text">PeerMart</span>
        </Link>

        <div className="navbar-links">
          <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
            <Home size={16} />
            Home
          </Link>
          <Link to="/marketplace" className={`nav-link ${isActive("/marketplace") ? "active" : ""}`}>
            <Store size={16} />
            Marketplace
          </Link>
          
          {currentUser ? (
            <>
              <Link to="/post-item" className={`nav-link ${isActive("/post-item") ? "active" : ""}`}>
                <PlusCircle size={16} />
                Sell
              </Link>
              <Link to="/profile" className="nav-link nav-link-profile">
                <div className="nav-avatar">
                  {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : "S"}
                </div>
                {currentUser.displayName?.split(" ")[0] || "Profile"}
              </Link>
            </>
          ) : (
            <Link to="/login" className="nav-link nav-link-cta">
              <LogIn size={16} />
              Sign In
            </Link>
          )}
        </div>

        <button
          className={`navbar-hamburger ${mobileOpen ? "open" : ""}`}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </nav>

      <div className={`mobile-menu ${mobileOpen ? "open" : ""}`}>
        <Link to="/" className={`nav-link ${isActive("/") ? "active" : ""}`}>
          <Home size={20} />
          Home
        </Link>
        <Link to="/marketplace" className={`nav-link ${isActive("/marketplace") ? "active" : ""}`}>
          <Store size={20} />
          Marketplace
        </Link>
        {currentUser ? (
          <>
            <Link to="/post-item" className={`nav-link ${isActive("/post-item") ? "active" : ""}`}>
              <PlusCircle size={20} />
              Sell Item
            </Link>
            <Link to="/profile" className={`nav-link ${isActive("/profile") ? "active" : ""}`}>
              <User size={20} />
              Profile
            </Link>
          </>
        ) : (
          <Link to="/login" className="nav-link nav-link-cta">
            <LogIn size={20} />
            Sign In
          </Link>
        )}
      </div>
    </>
  );
}

export default Navbar;