import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { Bell, CheckCheck, ShoppingCart, Mail, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

function Notifications() {
  const { currentUser, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const recipients = isAdmin ? [currentUser.uid, "ADMIN_GROUP"] : [currentUser.uid];
    const q = query(
      collection(db, "notifications"),
      where("recipientId", "in", recipients),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(data);
      setLoading(false);
    }, (error) => {
      console.error("Notifications listener error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, isAdmin]);

  async function markAsRead(notifId) {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
    } catch (error) {
      toast.error("Failed to update notification");
    }
  }

  async function markAllRead() {
    try {
      const batch = writeBatch(db);
      notifications
        .filter((n) => !n.read)
        .forEach((n) => {
          batch.update(doc(db, "notifications", n.id), { read: true });
        });
      await batch.commit();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to update notifications");
    }
  }

  function timeAgo(timestamp) {
    if (!timestamp) return "";
    const seconds = Math.floor((Date.now() - timestamp.toMillis()) / 1000);
    if (seconds < 60) return "Just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="marketplace" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Notifications</span>
        </h1>
        <p>Stay updated on reservations and activity on your listings.</p>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-lg)" }}>
        <p className="items-count" style={{ margin: 0 }}>
          {unreadCount} unread notification{unreadCount !== 1 && "s"}
        </p>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn btn-secondary"
            style={{ padding: "8px 16px", fontSize: "var(--font-sm)" }}
          >
            <CheckCheck size={16} />
            Mark all read
          </button>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card" style={{ height: "100px" }}>
              <div className="skeleton-body">
                <div className="skeleton-line w-60 h-lg"></div>
                <div className="skeleton-line w-80"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && notifications.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Bell size={32} />
          </div>
          <h3>No notifications yet</h3>
          <p>When a buyer reserves one of your items, you'll be notified here.</p>
        </div>
      )}

      {/* Notifications List */}
      {!loading && notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="notif-card"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "var(--space-lg)",
                padding: "var(--space-lg) var(--space-xl)",
                background: notif.read ? "var(--bg-card)" : "rgba(244, 163, 0, 0.06)",
                borderRadius: "var(--radius-lg)",
                border: notif.read
                  ? "1px solid var(--border-subtle)"
                  : "1px solid rgba(244, 163, 0, 0.25)",
                transition: "all var(--transition-fast)",
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "var(--radius-md)",
                  background: notif.read
                    ? "var(--bg-darker)"
                    : "rgba(244, 163, 0, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  color: notif.read ? "var(--text-muted)" : "var(--accent-primary)",
                }}
              >
                <ShoppingCart size={20} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)" }}>
                  <p style={{ margin: 0, fontWeight: notif.read ? 400 : 600, color: "var(--text-primary)", fontSize: "var(--font-base)" }}>
                    {notif.type === "reservation_admin" ? (
                      <>
                        <span style={{ color: "var(--warning)", fontWeight: 700 }}>[ADMIN]</span>{" "}
                        <strong>{notif.buyerName}</strong> wants to buy{" "}
                        <strong style={{ color: "var(--accent-primary)" }}>"{notif.itemTitle}"</strong>{" "}
                        from <strong>{notif.sellerName}</strong>
                      </>
                    ) : (
                      <>
                        Someone has reserved your item{" "}
                        <strong style={{ color: "var(--accent-primary)" }}>"{notif.itemTitle}"</strong>.{" "}
                        The admin will contact you shortly.
                      </>
                    )}
                  </p>
                  {!notif.read && (
                    <span style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: "var(--accent-primary)",
                      flexShrink: 0,
                      marginTop: "8px",
                    }}></span>
                  )}
                </div>

                {notif.type === "reservation_admin" ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }} title="Buyer Email">
                      <span style={{ fontWeight: 600 }}>B:</span> <Mail size={13} /> {notif.buyerEmail}
                    </span>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }} title="Seller Email">
                      <span style={{ fontWeight: 600 }}>S:</span> <Mail size={13} /> {notif.sellerEmail}
                    </span>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                      ₹{notif.itemPrice}
                    </span>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} />
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-lg)", marginTop: "var(--space-sm)", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px" }}>
                      ₹{notif.itemPrice}
                    </span>
                    <span style={{ fontSize: "var(--font-sm)", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={13} />
                      {timeAgo(notif.createdAt)}
                    </span>
                  </div>
                )}

                {!notif.read && (
                  <button
                    onClick={() => markAsRead(notif.id)}
                    style={{
                      marginTop: "var(--space-md)",
                      padding: "6px 14px",
                      borderRadius: "var(--radius-md)",
                      background: "var(--bg-glass-strong)",
                      border: "1px solid var(--border-subtle)",
                      color: "var(--text-secondary)",
                      fontSize: "var(--font-xs)",
                      fontWeight: 500,
                      cursor: "pointer",
                      transition: "all var(--transition-fast)",
                    }}
                  >
                    Mark as read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Notifications;
