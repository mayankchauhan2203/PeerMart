import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Package, ShoppingCart, CheckCircle, User, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reservePhone, setReservePhone] = useState("");
  const [confirmText, setConfirmText] = useState("");

  useEffect(() => {
    async function fetchItem() {
      try {
        const itemSnap = await getDoc(doc(db, "items", id));
        if (itemSnap.exists()) {
          setItem({ id: itemSnap.id, ...itemSnap.data() });
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
    setReservePhone(userData?.phone || "");
    setConfirmText("");
    setShowReserveModal(true);
  }

  async function handleConfirmReserve(e) {
    e.preventDefault();
    if (reservePhone.replace(/\D/g, '').length !== 10) {
      toast.error("Please enter a valid 10-digit phone number");
      return;
    }
    if (confirmText.toLowerCase() !== "reserve") {
      toast.error("Please type 'reserve' to confirm");
      return;
    }

    try {
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

      toast.success("Item reserved successfully!");
      setItem(prev => ({ ...prev, status: "reserved" }));
      setShowReserveModal(false);
    } catch (error) {
      console.error("Error reserving item:", error);
      toast.error("Failed to reserve item");
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
              >
                <ShoppingCart size={20} />
                Reserve Now
              </button>
            ) : (
              <button className="buy-btn buy-btn-reserved item-details-btn" disabled>
                <CheckCircle size={20} />
                Reserved
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
    </div>
  );
}

export default ItemDetails;
