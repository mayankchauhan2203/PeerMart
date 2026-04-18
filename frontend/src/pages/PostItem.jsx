import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, setDoc, serverTimestamp, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase";
import { Send, Camera, Tag, DollarSign, FileText, Layers, X, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const CATEGORIES = ["Electronics", "Books", "Furniture", "Clothing", "Sports", "Other"];
const MAX_PHOTOS = 4;

function PostItem() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [photos, setPhotos] = useState([]); // [{file, preview}]
  const [submitting, setSubmitting] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [modalPhone, setModalPhone] = useState("");

  const cameraInputRef = useRef(null);
  const navigate = useNavigate();
  const { currentUser, userData, isBlocked } = useAuth();

  function handleCameraCapture(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = MAX_PHOTOS - photos.length;
    const toAdd = files.slice(0, remaining);

    const oversized = toAdd.filter(f => f.size > 10 * 1024 * 1024);
    if (oversized.length) {
      toast.error("Each photo must be less than 10MB");
      return;
    }

    const previews = toAdd.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos(prev => [...prev, ...previews]);

    // Reset input so the same photo can be re-added if removed
    e.target.value = "";
  }

  function removePhoto(index) {
    setPhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "duds5cijd");

    const res = await fetch("https://api.cloudinary.com/v1_1/duds5cijd/image/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    if (!data.secure_url) throw new Error(data.error?.message || "Upload failed");
    return data.secure_url;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isBlocked) {
      toast.error("Your account has been blocked. Contact the admin.");
      return;
    }
    if (photos.length === 0) {
      toast.error("Please take at least one photo of the item.");
      return;
    }
    if (!userData?.phone) {
      setShowPhoneModal(true);
      return;
    }
    await executePostItem();
  }

  async function executePostItem(phoneToSave = null) {
    setSubmitting(true);
    try {
      if (phoneToSave) {
        await updateDoc(doc(db, "users", currentUser.uid), { phone: phoneToSave });
      }

      // Rate-limit: max 2 items per 24h
      const q = query(collection(db, "items"), where("sellerId", "==", currentUser.uid));
      const snap = await getDocs(q);
      const limitTime = Date.now() - 24 * 60 * 60 * 1000;
      let count24h = 0;
      snap.forEach(d => {
        const data = d.data();
        if (data.createdAt?.toMillis?.() >= limitTime) count24h++;
      });
      if (count24h >= 2) {
        toast.error("Daily limit reached: You can only list 2 items per 24 hours.");
        setSubmitting(false);
        return;
      }

      // Upload all photos
      const uploadPromises = photos.map(p => uploadToCloudinary(p.file));
      let imageUrls;
      try {
        imageUrls = await Promise.all(uploadPromises);
      } catch (err) {
        toast.error("One or more photos failed to upload. Please try again.");
        setSubmitting(false);
        return;
      }

      const itemRef = await addDoc(collection(db, "items"), {
        title,
        price: Number(price),
        description,
        category: category || "Other",
        image: imageUrls[0],       // keep backward compat for cards in Marketplace/Home
        images: imageUrls,         // full array for ItemDetails carousel
        status: "available",
        sellerId: currentUser.uid,
        sellerName: userData?.name || currentUser.displayName || "IITD Student",
        sellerEmail: userData?.email || currentUser.email,
        createdAt: serverTimestamp(),
      });

      // Store phone in a private subcollection — not readable by the public
      await setDoc(doc(db, "items", itemRef.id, "private", "contact"), {
        sellerPhone: userData?.phone || "",
        sellerId: currentUser.uid,
      });

      toast.success("Item listed successfully!");
      navigate("/marketplace");
    } catch (error) {
      console.error(error);
      toast.error("Failed to list item. Try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="post-item">
      <div className="post-item-header">
        <h1>List a <span className="gradient-text">New Item</span></h1>
        <p>Fill in the details and take up to 4 photos — your item will be live in seconds.</p>
      </div>

      {isBlocked && (
        <div style={{
          backgroundColor: "rgba(248,113,113,0.15)", border: "1px solid var(--danger)",
          color: "var(--danger)", padding: "var(--space-md)", borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-xl)", fontWeight: 600, textAlign: "center"
        }}>
          Your account has been blocked. You cannot list new items. Contact the admin.
        </div>
      )}

      <form onSubmit={handleSubmit} className="post-item-form">
        {/* ── Left column: fields ── */}
        <div className="form-fields">
          <div className="form-group">
            <label htmlFor="post-title">
              <Tag size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Item Title
            </label>
            <input type="text" id="post-title" placeholder="e.g. MacBook Air M2"
              value={title} onChange={e => setTitle(e.target.value)} required />
          </div>

          <div className="form-group">
            <label htmlFor="post-price">
              <DollarSign size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Price (₹)
            </label>
            <input type="number" id="post-price" placeholder="e.g. 45000"
              value={price} onChange={e => setPrice(e.target.value)} required min="0" />
          </div>

          <div className="form-group">
            <label htmlFor="post-category">
              <Layers size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Category
            </label>
            <select id="post-category" value={category} onChange={e => setCategory(e.target.value)} required>
              <option value="">Select a category</option>
              {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="post-description">
              <FileText size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
              Description
            </label>
            <textarea id="post-description"
              placeholder="Describe your item — condition, age, reason for selling..."
              value={description} onChange={e => setDescription(e.target.value)} rows={5} required />
          </div>
        </div>

        {/* ── Right column: camera + previews ── */}
        <div className="image-upload-area">
          <label style={{ fontSize: "var(--font-sm)", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: "var(--space-md)" }}>
            <Camera size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
            Item Photos ({photos.length}/{MAX_PHOTOS})
          </label>

          {/* Photo grid */}
          {photos.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "var(--space-sm)", marginBottom: "var(--space-md)" }}>
              {photos.map((p, i) => (
                <div key={i} style={{ position: "relative", aspectRatio: "1", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-subtle)" }}>
                  <img src={p.preview} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  {/* Remove button */}
                  <button type="button" onClick={() => removePhoto(i)} style={{
                    position: "absolute", top: 6, right: 6,
                    background: "rgba(0,0,0,0.7)", border: "none", borderRadius: "50%",
                    width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", color: "white"
                  }}>
                    <X size={14} />
                  </button>
                  {i === 0 && (
                    <span style={{ position: "absolute", bottom: 6, left: 6, fontSize: "10px", fontWeight: 700, background: "var(--accent-primary)", color: "#000", padding: "2px 6px", borderRadius: 4 }}>
                      COVER
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add photo button */}
          {photos.length < MAX_PHOTOS && (
            <div
              className={`image-dropzone ${photos.length === 0 ? "" : "has-image"}`}
              style={{ cursor: "pointer", position: "relative" }}
            >
              <div className="dropzone-icon"><Camera size={24} /></div>
              <p>{photos.length === 0 ? "Tap to open camera" : "Add another photo"}</p>
              <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>
                {photos.length === 0 ? "You can add up to 4 photos" : `${MAX_PHOTOS - photos.length} slot${MAX_PHOTOS - photos.length > 1 ? "s" : ""} remaining`}
              </p>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                multiple={photos.length < MAX_PHOTOS - 1}
                onChange={handleCameraCapture}
                style={{ position: "absolute", inset: 0, opacity: 0, cursor: "pointer" }}
              />
            </div>
          )}

          {photos.length === MAX_PHOTOS && (
            <p style={{ fontSize: "12px", color: "var(--text-muted)", textAlign: "center", marginTop: "var(--space-sm)" }}>
              Maximum of {MAX_PHOTOS} photos reached. Remove one to add another.
            </p>
          )}
        </div>

        {/* Submit button — renders last on mobile via CSS order:3 */}
        <div className="submit-btn-wrapper">
          <button type="submit" className="submit-btn"
            disabled={isBlocked || submitting || !title.trim() || !price || !category || !description.trim() || photos.length === 0}>
            {submitting ? (
              <>
                <span style={{ width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                Posting...
              </>
            ) : (
              <><Send size={18} /> List Item</>
            )}
          </button>
        </div>
      </form>

      {/* Phone Number Modal */}
      {showPhoneModal && (
        <div className="reserve-modal-overlay">
          <div className="reserve-modal">
            <h2 className="reserve-modal-title">Missing Phone Number</h2>
            <p className="reserve-modal-subtitle">We need a contact number to list your item. It will be saved to your profile.</p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (modalPhone.replace(/\D/g, "").length !== 10) {
                toast.error("Please enter a valid 10-digit phone number");
                return;
              }
              setShowPhoneModal(false);
              await executePostItem(modalPhone);
            }}>
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label>Phone Number (10 digits)</label>
                <input type="tel" value={modalPhone} onChange={e => setModalPhone(e.target.value)}
                  placeholder="e.g. 9876543210" required />
              </div>
              <div className="edit-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowPhoneModal(false)}>Cancel</button>
                <button type="submit" className="btn-save">Save &amp; Post</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PostItem;