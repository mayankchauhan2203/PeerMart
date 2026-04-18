import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, getDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Package, ShieldAlert, X, Phone, User, Mail, ChevronLeft, MapPin } from "lucide-react";
import toast from "react-hot-toast";

function MyReservations() {
  const { currentUser } = useAuth();
  const [reservedItems, setReservedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal logic
  const [actionLoading, setActionLoading] = useState(false);
  const [showSellerDetails, setShowSellerDetails] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);

  useEffect(() => {
    async function fetchReservedItems() {
      if (!currentUser) return;
      
      try {
        const q = query(
          collection(db, "items"),
          where("reservedBy", "==", currentUser.uid),
          where("status", "==", "reserved")
        );
        
        const querySnapshot = await getDocs(q);
        const itemsList = [];
        querySnapshot.forEach((doc) => {
          itemsList.push({ id: doc.id, ...doc.data() });
        });
        
        // Sort effectively (by reservation timestamp if available, else creation time)
        itemsList.sort((a, b) => {
          const tA = a.reservedAt?.toMillis ? a.reservedAt.toMillis() : (a.createdAt?.toMillis ? a.createdAt.toMillis() : 0);
          const tB = b.reservedAt?.toMillis ? b.reservedAt.toMillis() : (b.createdAt?.toMillis ? b.createdAt.toMillis() : 0);
          return tB - tA;
        });

        setReservedItems(itemsList);
      } catch (error) {
        console.error("Error fetching reservations:", error);
        toast.error("Failed to load your reservations");
      } finally {
        setLoading(false);
      }
    }

    fetchReservedItems();
  }, [currentUser]);

  const handleUnreserve = async (item) => {
    if (!window.confirm("Are you sure you want to cancel this reservation? The reservation fee will not be refunded.")) return;
    
    setActionLoading(true);
    try {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, {
        status: "available",
        reservedBy: null,
        reservedByName: null,
        reservedByEmail: null,
        reservedByPhone: null,
        reservedAt: null,
      });

      // Clear reservedBy from private subcollection
      await updateDoc(doc(db, "items", item.id, "private", "contact"), {
        reservedBy: deleteField(),
      }).catch(() => {});

      // Notification
      await addDoc(collection(db, "notifications"), {
        recipientId: item.sellerId,
        type: "item_unreserved",
        itemId: item.id,
        itemTitle: item.title,
        read: false,
        createdAt: serverTimestamp(),
      });

      setReservedItems(prev => prev.filter(i => i.id !== item.id));
      toast.success("Reservation cancelled.");
    } catch (error) {
      toast.error("Failed to cancel reservation.");
    } finally {
      setActionLoading(false);
    }
  };

  const openSellerDetails = async (item) => {
    setActionLoading(true);
    try {
      const userSnap = await getDoc(doc(db, "users", item.sellerId));
      setSelectedSeller({
        name:  item.sellerName  || "Unknown",
        email: item.sellerEmail || "Private",
        phone: userSnap.exists() ? (userSnap.data().phone || "Not provided") : "Not provided",
      });
      setShowSellerDetails(true);
    } catch (error) {
      toast.error("Failed to load seller details.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="marketplace" style={{ maxWidth: '900px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          My <span className="gradient-text">Reservations</span>
        </h1>
        <p>Manage items you've locked in and connect with their sellers.</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-2xl) 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : reservedItems.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: 'rgba(244, 163, 0, 0.1)', color: 'var(--accent-primary)' }}>
            <Package size={32} />
          </div>
          <h3>No Active Reservations</h3>
          <p>You haven't reserved any items yet. Browse the marketplace to find something you like!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--space-md)' }}>
          {reservedItems.map((item) => (
            <div key={item.id} className="item-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', background: 'var(--bg-glass-strong)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-md) var(--space-lg)', justifyItems: 'space-between' }}>
              
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '18px' }}>{item.title}</h3>
                <span className="gradient-text" style={{ fontWeight: 'bold', fontSize: '15px' }}>₹{item.price}</span>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Reserved on: {item.reservedAt ? new Date(item.reservedAt.toMillis()).toLocaleDateString() : 'Unknown'}
                </span>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end', marginLeft: 'auto' }}>
                <button 
                  className="btn btn-primary" 
                  style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => openSellerDetails(item)}
                  disabled={actionLoading}
                >
                  <User size={14} /> Get Seller Details
                </button>
                <button 
                  className="btn btn-secondary" 
                  style={{ padding: '8px 16px', fontSize: '13px', background: 'rgba(248, 113, 113, 0.1)', color: 'var(--danger)', border: '1px solid rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', gap: '6px' }}
                  onClick={() => handleUnreserve(item)}
                  disabled={actionLoading}
                >
                  <X size={14} /> Unreserve
                </button>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Seller Details Modal */}
      {showSellerDetails && selectedSeller && (
        <div className="reserve-modal-overlay">
          <div className="reserve-modal" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)' }}>
              <h2 className="reserve-modal-title" style={{ margin: 0, fontSize: '1.25rem' }}>Seller Details</h2>
              <button 
                onClick={() => setShowSellerDetails(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-darker)', padding: '10px', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                  <User size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</div>
                  <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedSeller.name || "Unknown"}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-darker)', padding: '10px', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                  <Mail size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email Address</div>
                  <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedSeller.email || "Private"}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'var(--bg-darker)', padding: '10px', borderRadius: '50%', color: 'var(--accent-primary)' }}>
                  <Phone size={20} />
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone Number</div>
                  <div style={{ fontSize: '16px', color: 'var(--text-primary)', fontWeight: '500' }}>{selectedSeller.phone || "Not provided"}</div>
                </div>
              </div>
            </div>

            <div style={{ background: 'rgba(244, 163, 0, 0.05)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', border: '1px inset var(--border-subtle)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldAlert size={18} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Coordinate a safe meeting place on campus before completing the transaction. 
              </p>
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}

export default MyReservations;
