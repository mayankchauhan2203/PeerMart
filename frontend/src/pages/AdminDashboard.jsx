import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, deleteField, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { Shield, Package, Phone, Mail, User, XCircle, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  async function handleUnreserve(order) {
    if (!window.confirm("Are you sure you want to cancel this reservation? The item will be made available to everyone again.")) return;
    try {
      const itemRef = doc(db, "items", order.id);
      await updateDoc(itemRef, {
        status: "available",
        reservedBy: deleteField(),
        reservedByName: deleteField(),
        reservedByEmail: deleteField()
      });
      if (order.sellerId) {
        await addDoc(collection(db, "notifications"), {
          recipientId: order.sellerId,
          type: "item_unreserved",
          itemId: order.id,
          itemTitle: order.title,
          itemPrice: order.price,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      setOrders(prev => prev.filter(o => o.id !== order.id));
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
      await updateDoc(itemRef, { status: "sold" });
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

          let sellerPhone = "N/A";
          if (item.sellerId) {
            try {
              const sellerSnap = await getDoc(doc(db, "users", item.sellerId));
              if (sellerSnap.exists()) sellerPhone = sellerSnap.data().phone || "No phone";
            } catch (e) { console.error(e); }
          }

          let buyerPhone = "N/A";
          if (item.reservedBy) {
            try {
              const buyerSnap = await getDoc(doc(db, "users", item.reservedBy));
              if (buyerSnap.exists()) buyerPhone = buyerSnap.data().phone || "No phone";
            } catch (e) { console.error(e); }
          }

          return { ...item, sellerPhone, buyerPhone };
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
    <div className="admin-dashboard">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-top">
          <div className="admin-icon">
            <Shield size={22} color="white" />
          </div>
          <h1 className="admin-title">Admin</h1>
        </div>
        <h2 className="admin-subtitle gradient-text">Dashboard</h2>
        <p className="admin-desc">Mediate active transactions and view complete contact details</p>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="loading-spinner"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Package size={32} /></div>
          <h3>No active reservations</h3>
          <p>There are no items currently awaiting mediation.</p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {orders.map(order => (
            <div key={order.id} className="admin-order-card">
              {/* Item Info */}
              <div className="admin-order-section">
                <h3 className="admin-section-heading">Item Details</h3>
                <div className="admin-item-row">
                  {order.image ? (
                    <img src={order.image} alt={order.title} className="admin-item-thumb" />
                  ) : (
                    <div className="admin-item-thumb-placeholder">
                      <Package size={24} color="var(--text-muted)" />
                    </div>
                  )}
                  <div>
                    <h4 className="admin-item-title">{order.title}</h4>
                    <span className="admin-item-price">₹{order.price}</span>
                    <p className="admin-item-category">Category: {order.category}</p>
                  </div>
                </div>
              </div>

              {/* Seller Info */}
              <div className="admin-order-section">
                <h3 className="admin-section-heading"><User size={15} /> Seller (Owner)</h3>
                <p className="admin-contact-name">{order.sellerName || "Unknown"}</p>
                <p className="admin-contact-detail"><Mail size={13} /> {order.sellerEmail || "N/A"}</p>
                <p className="admin-contact-detail"><Phone size={13} /> {order.sellerPhone}</p>
              </div>

              {/* Buyer Info */}
              <div className="admin-order-section">
                <h3 className="admin-section-heading"><User size={15} /> Buyer (Reserved By)</h3>
                <p className="admin-contact-name">{order.reservedByName || "Unknown"}</p>
                <p className="admin-contact-detail"><Mail size={13} /> {order.reservedByEmail || "N/A"}</p>
                <p className="admin-contact-detail"><Phone size={13} /> {order.buyerPhone}</p>
              </div>

              {/* Actions */}
              <div className="admin-order-actions">
                <button className="admin-btn-cancel" onClick={() => handleUnreserve(order)}>
                  <XCircle size={15} /> Cancel &amp; Unreserve
                </button>
                <button className="admin-btn-complete" onClick={() => handleMarkComplete(order.id)}>
                  <CheckCircle size={15} /> Mark as Complete
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
