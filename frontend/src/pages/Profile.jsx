import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User, Shield, ChevronRight, Package, Star, ShoppingBag, CheckCircle, ClipboardList,
  LogOut, Edit3, Save, X, Phone, AlignLeft, Trash2, Eye, EyeOff,
  ShieldCheck
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
              <label>Bio</label>
              <div className="input-with-icon">
                <AlignLeft size={16} className="input-icon" style={{ top: '16px', transform: 'none' }} />
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Branch, or things you usually sell..."
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

            {/* Read-Only Verified Data */}
            {userData?.kerberos_id && (
              <div className="verified-identity" style={{ marginTop: '1.5rem', background: 'rgba(74, 222, 128, 0.05)', border: '1px solid rgba(74, 222, 128, 0.2)', padding: '1rem', borderRadius: 'var(--radius-md)', textAlign: 'left' }}>
                <h4 style={{ color: '#4ade80', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.75rem 0', fontSize: '0.9rem' }}>
                  <ShieldCheck size={16} /> Verified IITD Details
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.85rem' }}>
                  {userData.entry_number && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--text-muted)' }}>Entry:</span> <span>{userData.entry_number.toUpperCase()}</span></div>}
                  {userData.kerberos_id && <div style={{ display: 'flex', gap: '0.5rem' }}><span style={{ color: 'var(--text-muted)' }}>Kerberos:</span> <span>{userData.kerberos_id}</span></div>}
                  {userData.hostel && <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Hostel:</span> <span>{userData.hostel}</span></div>}
                  {userData.department && <div style={{ display: 'flex', gap: '0.5rem', gridColumn: 'span 2' }}><span style={{ color: 'var(--text-muted)' }}>Dept:</span> <span>{userData.department}</span></div>}
                </div>
              </div>
            )}
            
            {/* Profile Statistics Block */}
            <div className="profile-stats" style={{ opacity: isEditing ? 0.5 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}>
              <div className="profile-stat">
                <h3>{listingsCount}</h3>
                <p>Listings</p>
              </div>
              <div className="profile-stat">
                <h3>{boughtCount}</h3>
                <p>Bought</p>
              </div>
            </div>
          </>
        )}
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
          <Link to="/my-reservations" className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><CheckCircle size={18} /></div>
              <div className="setting-text">
                <h4>My Reservations</h4>
                <p>Track items you've locked in</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </Link>
          <Link to="/my-completed-orders" className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><ClipboardList size={18} /></div>
              <div className="setting-text">
                <h4>My Completed Orders</h4>
                <p>View your sold &amp; bought history</p>
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