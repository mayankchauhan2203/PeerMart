import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import { db } from "../firebase";
import { Shield, Package, Phone, Mail, User, XCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function handleUnreserve(orderId) {
    if (!window.confirm("Are you sure you want to cancel this reservation? The item will be made available to everyone again.")) return;
    
    try {
      const itemRef = doc(db, "items", orderId);
      await updateDoc(itemRef, {
        status: "available",
        reservedBy: deleteField(),
        reservedByName: deleteField(),
        reservedByEmail: deleteField()
      });
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success("Reservation cancelled successfully");
    } catch (error) {
      console.error("Error unreserving item:", error);
      toast.error("Failed to cancel reservation");
    }
  }

  async function handleMarkComplete(orderId) {
    if (!window.confirm("Are you sure you want to mark this transaction as complete? This will finalize the sale and remove the item from the marketplace.")) return;
    
    try {
      const itemRef = doc(db, "items", orderId);
      await updateDoc(itemRef, {
        status: "sold"
      });
      
      setOrders(prev => prev.filter(o => o.id !== orderId));
      toast.success("Transaction marked as complete!");
    } catch (error) {
      console.error("Error completing transaction:", error);
      toast.error("Failed to mark transaction as complete");
    }
  }

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const itemsRef = collection(db, "items");
        const q = query(itemsRef, where("status", "==", "reserved"));
        const snapshot = await getDocs(q);

        const ordersData = await Promise.all(snapshot.docs.map(async (itemDoc) => {
          const item = { id: itemDoc.id, ...itemDoc.data() };
          
          // Fetch Seller Details
          let sellerPhone = "N/A";
          if (item.sellerId) {
            try {
              const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
              if (sellerSnap.exists()) sellerPhone = sellerSnap.data().phone || "No phone";
            } catch (e) {
              console.error(e);
            }
          }

          // Fetch Buyer Details
          let buyerPhone = "N/A";
          if (item.reservedBy) {
            try {
              const buyerSnap = await getDoc(doc(db, "users", item.reservedBy));
              if (buyerSnap.exists()) buyerPhone = buyerSnap.data().phone || "No phone";
            } catch (e) {
              console.error(e);
            }
          }

          return {
            ...item,
            sellerPhone,
            buyerPhone
          };
        }));

        setOrders(ordersData);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, []);

  return (
    <div className="marketplace">
      <div className="marketplace-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--space-xl)' }}>
        <div style={{ background: 'var(--accent-gradient)', padding: '12px', borderRadius: '12px', display: 'flex' }}>
          <Shield size={28} color="white" />
        </div>
        <div>
          <h1 style={{ margin: 0 }}>Admin <span className="gradient-text">Dashboard</span></h1>
          <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Mediate active transactions and view complete contact details</p>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={32} /></div>
          <h3>No active reservations</h3>
          <p>There are no items currently awaiting mediation.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {orders.map(order => (
            <div key={order.id} style={{ 
              background: 'var(--bg-card)', 
              borderRadius: '16px', 
              border: '1px solid var(--border-subtle)',
              padding: 'var(--space-lg)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 'var(--space-lg)'
            }}>
              {/* Item Info */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '12px' }}>Item Details</h3>
                <div style={{ display: 'flex', gap: '16px' }}>
                  {order.image ? (
                    <img src={order.image} alt={order.title} style={{ width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '80px', height: '80px', borderRadius: '8px', background: 'var(--bg-darker)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Package size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.1rem' }}>{order.title}</h4>
                    <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>₹{order.price}</span>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Category: {order.category}</p>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} /> Seller (Owner)
                </h3>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><strong>{order.sellerName || "Unknown"}</strong></p>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Mail size={14} /> {order.sellerEmail || "N/A"}</p>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Phone size={14} /> {order.sellerPhone}</p>
              </div>

              {/* Buyer Info */}
              <div>
                <h3 style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={16} color="var(--accent)" /> Buyer (Reserved By)
                </h3>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><strong>{order.reservedByName || "Unknown"}</strong></p>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Mail size={14} /> {order.reservedByEmail || "N/A"}</p>
                <p style={{ margin: '4px 0', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}><Phone size={14} /> {order.buyerPhone}</p>
              </div>

              {/* Actions Footer */}
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                  onClick={() => handleUnreserve(order.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(248, 113, 113, 0.1)', color: 'var(--danger)',
                    border: '1px solid rgba(248, 113, 113, 0.2)', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '500'
                  }}
                >
                  <XCircle size={16} /> Cancel & Unreserve
                </button>
                <button
                  onClick={() => handleMarkComplete(order.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--accent-primary)', color: '#1a1a1a',
                    border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                  }}
                >
                  <CheckCircle size={16} /> Mark as Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
