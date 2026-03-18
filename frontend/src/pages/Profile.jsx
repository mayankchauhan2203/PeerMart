import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  User, Settings, Bell, Shield, ChevronRight, Package, Star, ShoppingBag, 
  LogOut, Edit3, Camera, Save, X, Phone, AlignLeft 
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { db, storage } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import toast from "react-hot-toast";

function Profile() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // View vs Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Derived state
  const displayName = currentUser?.displayName || "Student User";
  const initial = displayName.charAt(0).toUpperCase();
  const currentPhotoURL = photoPreview || currentUser?.photoURL;

  useEffect(() => {
    async function fetchUserData() {
      if (!currentUser) return;
      
      try {
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhone(data.phone || "");
          setBio(data.bio || "");
        }
        
        setName(currentUser.displayName || "");
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

  function handleImageClick() {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image must be less than 5MB");
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    let newPhotoURL = currentUser.photoURL;

    try {
      // 1. Upload photo if selected
      if (photoFile) {
        const photoRef = ref(storage, `avatars/${currentUser.uid}`);
        await uploadBytes(photoRef, photoFile);
        newPhotoURL = await getDownloadURL(photoRef);
      }

      // 2. Update Firebase Auth Profile (Name & Photo)
      if (name !== currentUser.displayName || newPhotoURL !== currentUser.photoURL) {
        await updateProfile(currentUser, {
          displayName: name,
          photoURL: newPhotoURL
        });
      }

      // 3. Save extended details to Firestore
      const userRef = doc(db, "users", currentUser.uid);
      await setDoc(userRef, {
        phone: phone,
        bio: bio,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      toast.success("Profile updated successfully!");
      setIsEditing(false);
      
      // Clear tracking variables
      setPhotoFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    // Revert state
    setName(currentUser?.displayName || "");
    setPhotoPreview(null);
    setPhotoFile(null);
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

        <div 
          className={`profile-avatar ${isEditing ? 'editable' : ''}`} 
          onClick={handleImageClick}
        >
          {currentPhotoURL ? (
            <img 
              src={currentPhotoURL} 
              alt="Profile" 
              style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
            />
          ) : (
            <span>{initial}</span>
          )}
          
          {isEditing && (
            <div className="avatar-overlay">
              <Camera size={24} color="white" />
            </div>
          )}
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageChange} 
            accept="image/*" 
            style={{ display: 'none' }} 
          />
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
            <p className="profile-email">{currentUser?.email}</p>
            {phone && <p className="profile-phone"><Phone size={14}/> {phone}</p>}
            {bio && <p className="profile-bio">{bio}</p>}
          </>
        )}

        {/* Keeping stats for visuals */}
        <div className="profile-stats" style={{ opacity: isEditing ? 0.5 : 1, pointerEvents: isEditing ? 'none' : 'auto' }}>
          <div className="profile-stat">
            <h3>12</h3>
            <p>Listings</p>
          </div>
          <div className="profile-stat">
            <h3>4.8</h3>
            <p>Rating</p>
          </div>
          <div className="profile-stat">
            <h3>8</h3>
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
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Star size={18} /></div>
              <div className="setting-text">
                <h4>My Listings</h4>
                <p>Manage your active items</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </div>
        </div>

        <div className="settings-section">
          <h3>Account Settings</h3>
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
          <div className="setting-item">
            <div className="setting-info">
              <div className="setting-icon"><Shield size={18} /></div>
              <div className="setting-text">
                <h4>Security</h4>
                <p>Password and 2FA</p>
              </div>
            </div>
            <ChevronRight size={18} className="setting-arrow" />
          </div>

          <div 
            className="setting-item" 
            id="profile-logout" 
            onClick={handleLogout}
            style={{ cursor: "pointer", marginTop: "var(--space-md)", borderColor: "rgba(248, 113, 113, 0.2)" }}
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
        </div>
      </div>
    </div>
  );
}

export default Profile;