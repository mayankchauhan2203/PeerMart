import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingBag, Home, Store, PlusCircle, User, LogIn, Bell, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const location = useLocation();
  const { currentUser, isAdmin, userData } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // Real-time unread notification count
  useEffect(() => {
    if (!currentUser) {
      setUnreadCount(0);
      setAdminUnreadCount(0);
      return;
    }

    const qUser = query(
      collection(db, "notifications"),
      where("recipientId", "==", currentUser.uid),
      where("read", "==", false)
    );

    const unsubUser = onSnapshot(qUser, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error("Notification count listener error:", error);
    });

    let unsubAdmin = null;
    if (isAdmin) {
      const qAdmin = query(
        collection(db, "notifications"),
        where("recipientId", "==", "admin"),
        where("read", "==", false)
      );
      unsubAdmin = onSnapshot(qAdmin, (snapshot) => {
        setAdminUnreadCount(snapshot.size);
      }, (error) => {
        console.error("Admin notification count listener error:", error);
      });
    } else {
      setAdminUnreadCount(0);
    }

    return () => {
      unsubUser();
      if (unsubAdmin) unsubAdmin();
    };
  }, [currentUser, isAdmin]);

  const totalUnread = unreadCount + adminUnreadCount;

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
              {isAdmin && (
                <Link to="/admin-dashboard" className={`nav-link ${isActive("/admin-dashboard") ? "active" : ""}`}>
                  <Shield size={16} />
                  Admin
                </Link>
              )}
              <Link to="/post-item" className={`nav-link ${isActive("/post-item") ? "active" : ""}`}>
                <PlusCircle size={16} />
                Sell
              </Link>
              <Link to="/notifications" className={`nav-link nav-link-bell ${isActive("/notifications") ? "active" : ""}`}>
                <div className="bell-wrapper">
                  <Bell size={16} />
                  {totalUnread > 0 && (
                    <span className="notif-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>
                  )}
                </div>
              </Link>
              <Link to="/profile" className="nav-link nav-link-profile">
                <div className="nav-avatar" style={{ overflow: 'hidden' }}>
                  {userData?.photoURL || currentUser.photoURL ? (
                    <img
                      src={userData?.photoURL || currentUser.photoURL}
                      alt="Profile"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    (userData?.name || currentUser.displayName || "S").charAt(0).toUpperCase()
                  )}
                </div>
                {(userData?.name || currentUser.displayName)?.split(" ")[0] || "Profile"}
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
            {isAdmin && (
              <Link to="/admin-dashboard" className={`nav-link ${isActive("/admin-dashboard") ? "active" : ""}`}>
                <Shield size={20} />
                Admin Panel
              </Link>
            )}
            <Link to="/post-item" className={`nav-link ${isActive("/post-item") ? "active" : ""}`}>
              <PlusCircle size={20} />
              Sell Item
            </Link>
            <Link to="/notifications" className={`nav-link ${isActive("/notifications") ? "active" : ""}`}>
              <div className="bell-wrapper">
                <Bell size={20} />
                {totalUnread > 0 && (
                  <span className="notif-badge">{totalUnread > 9 ? "9+" : totalUnread}</span>
                )}
              </div>
              Notifications
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