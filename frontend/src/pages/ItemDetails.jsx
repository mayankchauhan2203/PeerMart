import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteField, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Package, ShoppingCart, CheckCircle, User, ArrowLeft, AlertTriangle, Trash2, XCircle } from "lucide-react";
import toast from "react-hot-toast";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, isBlocked, isAdmin } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reservePhone, setReservePhone] = useState("");
  const [confirmText, setConfirmText] = useState("");

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  useEffect(() => {
    async function fetchItem() {
      try {
        const itemSnap = await getDoc(doc(db, "items", id));
        if (itemSnap.exists()) {
          setItem({ id: itemSnap.id, ...itemSnap.data() });
          
          if (currentUser) {
            const q = query(
              collection(db, "reports"),
              where("itemId", "==", id),
              where("reporterId", "==", currentUser.uid)
            );
            // We use getDocs because reports shouldn't change too often to need a real-time listener for the user just to disable the button
            getDocs(q).then(reportSnap => {
              if (!reportSnap.empty) {
                setHasReported(true);
              }
            }).catch(e => console.error("Error checking report status", e));
          }
        } else {
          toast.error("Item not found");
          navigate("/marketplace");
        }
      } catch (error) {
        console.error("Error fetching item details:", error);
        toast.error("Failed to load item details");
      } finally {
        setLoading(false);
      }
    }
    fetchItem();
  }, [id, navigate]);

  function handleReserveClick() {
    if (!currentUser) {
      toast.error("You must be logged in to reserve an item.");
      navigate("/login", { state: { returnUrl: `/item/${id}` } });
      return;
    }
    if (isBlocked) {
      toast.error("Your account has been blocked. Contact the admin.");
      return;
    }
    setReservePhone(userData?.phone || "");
    setConfirmText("");
    setShowReserveModal(true);
  }

  async function handleConfirmReserve(e) {
    e.preventDefault();
    if (isBlocked) {
      toast.error("Your account has been blocked. Contact the admin.");
      setShowReserveModal(false);
      return;
    }
    if (reservePhone.replace(/\D/g, '').length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (confirmText.toLowerCase() !== "reserve") {
      toast.error("Please type 'reserve' to confirm");
      return;
    }

    try {
      // Rate-limit check: max 2 reservations per 24 hours
      const q = query(
        collection(db, "items"),
        where("reservedBy", "==", currentUser.uid)
      );
      const snap = await getDocs(q);
      const limitTime = Date.now() - 24 * 60 * 60 * 1000;
      let count24h = 0;

      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.reservedAt && typeof data.reservedAt.toMillis === 'function') {
          if (data.reservedAt.toMillis() >= limitTime) {
            count24h++;
          }
        }
      });

      if (count24h >= 2) {
        toast.error("Daily limit reached: You can only reserve 2 items per 24 hours.");
        setShowReserveModal(false);
        return;
      }

      if (reservePhone !== userData?.phone) {
        const userRef = doc(db, "users", currentUser.uid);
        await updateDoc(userRef, { phone: reservePhone });
      }

      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, {
        status: "reserved",
        reservedBy: currentUser.uid,
        reservedByName: currentUser.displayName || "IITD Student",
        reservedByEmail: currentUser.email,
        reservedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "notifications"), {
        recipientId: item.sellerId,
        type: "reservation_anonymous",
        itemId: item.id,
        itemTitle: item.title,
        itemPrice: item.price,
        read: false,
        createdAt: serverTimestamp(),
      });

      // Update the local state so the UI rerenders immediately without a refresh
      setItem(prev => ({
        ...prev,
        status: "reserved",
        reservedBy: currentUser.uid,
        reservedByName: currentUser.displayName || "IITD Student",
        reservedByEmail: currentUser.email
      }));

      toast.success("Item reserved successfully!");
      setShowReserveModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to reserve. Try again.");
    }
  }

  async function handleUnreserve() {
    if (!window.confirm("Are you sure you want to cancel your reservation for this item?")) return;
    try {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, {
        status: "available",
        reservedBy: deleteField(),
        reservedByName: deleteField(),
        reservedByEmail: deleteField(),
        reservedAt: deleteField(),
      });

      await addDoc(collection(db, "notifications"), {
        recipientId: item.sellerId,
        type: "item_unreserved",
        itemId: item.id,
        itemTitle: item.title,
        read: false,
        createdAt: serverTimestamp(),
      });

      setItem(prev => ({ 
        ...prev, 
        status: "available", 
        reservedBy: null,
        reservedByName: null,
        reservedByEmail: null
      }));

      toast.success("Reservation cancelled.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to cancel reservation.");
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault();
    if (!reportMessage.trim()) return;

    if (!currentUser) {
      toast.error("You must be logged in to report an item.");
      return;
    }

    setReportSubmitting(true);
    try {
      await addDoc(collection(db, "reports"), {
        itemId: item.id,
        itemTitle: item.title,
        sellerId: item.sellerId,
        reporterId: currentUser.uid,
        message: reportMessage,
        status: "pending",
        createdAt: serverTimestamp()
      });

      // If the user currently has this item reserved, cancel their reservation automatically
      if (item.status === "reserved" && item.reservedBy === currentUser.uid) {
        const itemRef = doc(db, "items", item.id);
        await updateDoc(itemRef, {
          status: "available",
          reservedBy: deleteField(),
          reservedByName: deleteField(),
          reservedByEmail: deleteField()
        });

        await addDoc(collection(db, "notifications"), {
          recipientId: item.sellerId,
          type: "item_unreserved",
          itemId: item.id,
          itemTitle: item.title,
          read: false,
          createdAt: serverTimestamp()
        });

        setItem(prev => ({ ...prev, status: "available" }));
      }

      // Notify admins
      await addDoc(collection(db, "notifications"), {
        recipientId: "admin",
        type: "new_report",
        itemId: item.id,
        itemTitle: item.title,
        reporterId: currentUser.uid,
        message: reportMessage,
        read: false,
        createdAt: serverTimestamp()
      });

      setHasReported(true);
      toast.success("Report submitted to admins.");
      setShowReportModal(false);
      setReportMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit report. Please try again.");
    } finally {
      setReportSubmitting(false);
    }
  }

  async function handleDeleteItem() {
    if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, "items", item.id));

      await addDoc(collection(db, "notifications"), {
        recipientId: item.sellerId,
        type: "item_deleted",
        itemId: item.id,
        itemTitle: item.title,
        read: false,
        createdAt: serverTimestamp()
      });

      toast.success("Item deleted successfully");
      navigate("/marketplace");
    } catch (error) {
      console.error("Error deleting item:", error);
      toast.error("Failed to delete item");
    }
  }

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!item) return null;

  return (
    <div className="item-details-page">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="item-details-back">
        <ArrowLeft size={20} /> Back to Marketplace
      </button>

      <div className="item-details-grid">
        
        {/* Image */}
        <div className="item-details-image-wrap">
          {item.image ? (
            <img src={item.image} alt={item.title} className="item-details-img" />
          ) : (
            <Package size={64} color="var(--text-muted)" />
          )}
          <span className={`product-card-badge ${item.status === "available" ? "badge-available" : "badge-reserved"}`}>
            {item.status === "available" ? "Available" : "Reserved"}
          </span>
        </div>

        {/* Details */}
        <div className="item-details-info">
          <div>
            <span className="item-details-category">{item.category}</span>
            <h1 className="item-details-title">{item.title}</h1>
            <div className="item-details-price">₹{Math.round(item.price * 1.08)}</div>
          </div>

          <div className="item-details-description">
            <h3 className="item-details-desc-heading">Description</h3>
            <p className="item-details-desc-text">
              {item.description || "No description provided by the seller."}
            </p>
          </div>

          <div className="item-details-action">
            {item.sellerId === currentUser?.uid ? (
              <button className="buy-btn item-details-btn" disabled>
                <User size={20} />
                This is your listing
              </button>
            ) : item.status === "available" ? (
              <button
                className="btn btn-primary item-details-btn"
                onClick={handleReserveClick}
                disabled={isBlocked || hasReported}
              >
                <ShoppingCart size={20} />
                {hasReported ? "Cannot reserve (Reported)" : "Reserve Now"}
              </button>
            ) : item.reservedBy === currentUser?.uid ? (
              <button 
                className="buy-btn buy-btn-reserved item-details-btn" 
                onClick={handleUnreserve}
                style={{ cursor: "pointer", opacity: 0.9, backgroundColor: "var(--danger)", color: "white", border: "none" }}
              >
                <XCircle size={20} />
                Cancel Reservation
              </button>
            ) : (
              <button className="buy-btn buy-btn-reserved item-details-btn" disabled>
                <CheckCircle size={20} />
                Reserved
              </button>
            )}
            
            {/* Report Button */}
            {currentUser?.uid !== item.sellerId && (
              <button 
                className="btn-cancel" 
                style={{ marginTop: "12px", width: "100%", display: "flex", justifyContent: "center", gap: "8px", opacity: hasReported ? 0.6 : 1, cursor: hasReported ? "not-allowed" : "pointer" }}
                onClick={() => {
                  if (!currentUser) {
                    toast.error("You must be logged in to report an item.");
                    navigate("/login");
                    return;
                  }
                  if (!hasReported) setShowReportModal(true);
                }}
                disabled={hasReported}
              >
                <AlertTriangle size={16} />
                {hasReported ? "Reported" : "Report Item"}
              </button>
            )}
            
            {/* Delete Button (Admins only) */}
            {isAdmin && (
              <button 
                className="btn-cancel" 
                style={{ marginTop: "12px", width: "100%", display: "flex", justifyContent: "center", gap: "8px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid var(--danger)", color: "var(--danger)" }}
                onClick={handleDeleteItem}
              >
                <Trash2 size={16} />
                Delete Item (Admin)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Reservation Modal */}
      {showReserveModal && (
        <div className="reserve-modal-overlay">
          <div className="reserve-modal">
            <h2 className="reserve-modal-title">Confirm Reservation</h2>
            <p className="reserve-modal-subtitle">Please provide your phone number and confirm to reserve this item.</p>
            <form onSubmit={handleConfirmReserve}>
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Phone Number (10 digits)</label>
                <input 
                  type="tel" 
                  value={reservePhone} 
                  onChange={(e) => setReservePhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  required 
                />
              </div>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Type <strong style={{ color: 'var(--accent-primary)' }}>reserve</strong> to confirm</label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="reserve"
                  required 
                />
              </div>
              <div className="edit-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReserveModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showReportModal && (
        <div className="reserve-modal-overlay">
          <div className="reserve-modal">
            <h2 className="reserve-modal-title">Report Item</h2>
            <p className="reserve-modal-subtitle">Briefly explain why this item is inappropriate or violates PeerMart policies.</p>
            <form onSubmit={handleReportSubmit}>
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label>Reason for reporting</label>
                <textarea 
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  placeholder="e.g. Scammer, inappropriate content..."
                  required 
                  rows={4}
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)", background: "var(--bg-secondary)", color: "var(--text-primary)", fontFamily: "var(--font-sans)", resize: "vertical" }}
                />
              </div>
              <div className="edit-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowReportModal(false)} disabled={reportSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={reportSubmitting || !reportMessage.trim()} style={{ background: "var(--danger)" }}>
                  {reportSubmitting ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ItemDetails;
