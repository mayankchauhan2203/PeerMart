import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Shield, ChevronRight, Package, Star, ShoppingBag,
  LogOut, Edit3, Save, X, Phone, AlignLeft, Trash2, Eye, EyeOff
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import toast from "react-hot-toast";

function Profile() {
  const { currentUser, logout, deleteAccount, changeUserPassword, userData, resetPassword } = useAuth();
  const navigate = useNavigate();

  // View vs Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");

  // Real-time Stats
  const [listingsCount, setListingsCount] = useState(0);
  const [boughtCount, setBoughtCount] = useState(0);

  // Derived state — prefer Firestore userData for IITD users (custom token has no email/displayName on Auth object)
  const displayName = userData?.name || currentUser?.displayName || "Student User";
  const displayEmail = userData?.email || currentUser?.email || "";
  const initial = displayName.charAt(0).toUpperCase();
  const currentPhotoURL = currentUser?.photoURL || null;

  // Sync form fields from context userData (real-time Firestore listener) when not actively editing
  useEffect(() => {
    if (!isEditing && userData) {
      setName(userData.name || currentUser?.displayName || "");
      setPhone(userData.phone || "");
      setBio(userData.bio || "");
    }
  }, [userData, isEditing, currentUser]);

  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser) return;

      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setName(data.name || currentUser.displayName || "");
          setPhone(data.phone || "");
          setBio(data.bio || "");
        } else {
          setName(currentUser.displayName || "");
        }

        // Fetch user stats securely
        const itemsRef = collection(db, "items");
        const listingsQuery = query(itemsRef, where("sellerId", "==", currentUser.uid));
        const listingsSnap = await getDocs(listingsQuery);
        setListingsCount(listingsSnap.size);

        const boughtQuery = query(itemsRef, where("reservedBy", "==", currentUser.uid));
        const boughtSnap = await getDocs(boughtQuery);
        setBoughtCount(boughtSnap.size);
        
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      toast.error("Failed to log out");
    }
  }

  async function handleDeleteAccount() {
    if (window.confirm("Are you sure you want to permanently delete your account? This action cannot be undone.")) {
      try {
        setSaving(true);
        const result = await deleteAccount();
        setSaving(false);

        if (result.success) {
          navigate("/login");
        } else if (result.forceLogout) {
          navigate("/login");
        }
      } catch (err) {
        setSaving(false);
        console.error("Fatal Crash in handleDeleteAccount:", err);
      }
    }
  }

  async function submitPasswordChange() {
    if (!oldPassword) {
      toast.error("Please enter your current password.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (!window.confirm("Are you sure you want to change your password?")) {
      return;
    }
    
    setSaving(true);
    const result = await changeUserPassword(oldPassword, newPassword);
    setSaving(false);

    if (result.success) {
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowPasswordForm(false);
    } else if (result.forceLogout) {
      navigate("/login");
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      // Update Firebase Auth display name
      if (name !== currentUser.displayName) {
        await updateProfile(currentUser, { displayName: name });
      }

      // Save name, phone, bio to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        name: name,
        phone: phone,
        bio: bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    setName(userData?.name || currentUser?.displayName || "");
    setIsEditing(false);
  }

  if (loading) {
    return (
      <div className="profile" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="profile">
      {/* Profile Card */}
      <div className="profile-card">
        {!isEditing && (
          <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
            <Edit3 size={16} /> Edit Profile
          </button>
        )}

        <div className="profile-avatar">
          {currentPhotoURL ? (
            <img
              src={currentPhotoURL}
              alt="Profile"
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <span>{initial}</span>
          )}
        </div>

        {isEditing ? (
          <div className="profile-edit-form">
            <div className="form-group edit-form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div className="form-group edit-form-group">
              <label>Phone Number</label>
              <div className="input-with-icon">
                <Phone size={16} className="input-icon" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <div className="form-group edit-form-group">
              <label>Bio / Hostel Info</label>
              <div className="input-with-icon">
                <AlignLeft size={16} className="input-icon" style={{ top: '16px', transform: 'none' }} />
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Hostel, Branch, or things you usually sell..."
                  rows={3}
                  style={{ paddingLeft: '44px' }}
                />
              </div>
            </div>

            <div className="edit-actions">
              <button className="btn-cancel" onClick={cancelEdit} disabled={saving}>
                <X size={16} /> Cancel
              </button>
              <button className="btn-save" onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        ) : (
          <>
            <h2>{displayName}</h2>
            <p className="profile-email">{displayEmail}</p>
            {phone && <p className="profile-phone"><Phone size={14} /> {phone}</p>}
            {bio && <p className="profile-bio">{bio}</p>}
          </>
        )}

        {/* Profile Statistics Block */}
        <div className="profile-stats" style={{ opacity: isEditing ? 0.5 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}>
          <div className="profile-stat">
            <h3>{listingsCount}</h3>
            <p>Listings</p>
          </div>
          <div className="profile-stat">
            <h3>{userData?.rating ? Number(userData.rating).toFixed(1) : "New"}</h3>
            <p>Rating</p>
          </div>
          <div className="profile-stat">
            <h3>{boughtCount}</h3>
            <p>Bought</p>
          </div>
        </div>
      </div>

      {/* Quick Actions & Settings Container */}
      <div className="profile-content" style={{ opacity: isEditing ? 0.3 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}>
        <div className="settings-section">
          <h3>Quick Actions</h3>
          <Link to="/post-item" className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Package size={18} /></div>
              <div className="setting-text">
                <h4>Post an Item</h4>
                <p>Sell something to the campus</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </Link>
          <Link to="/marketplace" className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><ShoppingBag size={18} /></div>
              <div className="setting-text">
                <h4>Browse Marketplace</h4>
                <p>Find what you need locally</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </Link>
          <Link to="/my-listings" className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Star size={18} /></div>
              <div className="setting-text">
                <h4>My Listings</h4>
                <p>Manage your active items</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </Link>
        </div>


        <div className="settings-section">
          <h3>Account Settings</h3>
          {/*
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Settings size={18} /></div>
              <div className="setting-text">
                <h4>Preferences</h4>
                <p>Theme, display settings</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </div>
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Bell size={18} /></div>
              <div className="setting-text">
                <h4>Notifications</h4>
                <p>Manage email alerts</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </div>
          */}

          <div className="setting-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: showPasswordForm ? 'var(--space-md)' : '16px' }}>
            <div
              className="setting-info"
              style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              onClick={() => setShowPasswordForm(!showPasswordForm)}
            >
              <div className="setting-icon"><Shield size={18} /></div>
              <div className="setting-text" style={{ flexGrow: 1 }}>
                <h4>Security</h4>
                <p>Change Password</p>
              </div>
              <ChevronRight size={18} className="setting-arrow" style={{ transform: showPasswordForm ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
            </div>

            {showPasswordForm && (
              <div className="password-change-form" style={{ width: '100%', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border-subtle)' }}>
                <div className="form-group edit-form-group" style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>
                  <label>Current Password</label>
                  <input
                    type={showOldPassword ? "text" : "password"}
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                    placeholder="Enter current password"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'white', marginTop: 'var(--space-xs)', paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    style={{ position: 'absolute', right: '10px', top: '36px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {showOldPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => resetPassword(currentUser.email)}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '12px', marginTop: '8px', padding: 0, textAlign: 'left' }}
                  >
                    Forgot current password? Send reset email
                  </button>
                </div>

                <div className="form-group edit-form-group" style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>
                  <label>New Password</label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'white', marginTop: 'var(--space-xs)', paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ position: 'absolute', right: '10px', top: '36px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <div className="form-group edit-form-group" style={{ marginBottom: 'var(--space-md)', position: 'relative' }}>
                  <label>Confirm Password</label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', background: 'var(--bg-card)', color: 'white', marginTop: 'var(--space-xs)', paddingRight: '40px' }}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ position: 'absolute', right: '10px', top: '36px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                <div className="edit-actions" style={{ justifyContent: 'flex-start', gap: 'var(--space-md)' }}>
                  <button className="btn-cancel" onClick={() => setShowPasswordForm(false)} disabled={saving} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    Cancel
                  </button>
                  <button className="btn-save" onClick={submitPasswordChange} disabled={saving} style={{ padding: '8px 16px', fontSize: '13px' }}>
                    {saving ? "Saving..." : "Update Password"}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className="setting-item"
            id="profile-logout"
            onClick={handleLogout}
            style={{ cursor: "pointer", borderColor: "rgba(248, 113, 113, 0.2)" }}
          >
            <div className="setting-info">
              <div className="setting-icon" style={{ color: "var(--danger)", background: "rgba(248, 113, 113, 0.1)" }}>
                <LogOut size={18} />
              </div>
              <div className="setting-text">
                <h4 style={{ color: "var(--danger)" }}>Sign Out</h4>
                <p>Log out of your account</p>
              </div>
            </div>
          </div>

          <div
            className="setting-item"
            id="profile-delete"
            onClick={handleDeleteAccount}
            style={{ cursor: "pointer", borderColor: "rgba(248, 113, 113, 0.5)", background: "rgba(248, 113, 113, 0.05)" }}
          >
            <div className="setting-info">
              <div className="setting-icon" style={{ color: "var(--danger)", background: "rgba(248, 113, 113, 0.2)" }}>
                <Trash2 size={18} />
              </div>
              <div className="setting-text">
                <h4 style={{ color: "var(--danger)" }}>Delete Account</h4>
                <p>Permanently remove your account</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;