import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Package, CheckCircle, ShoppingBag, Tag, User, Phone, Mail, Calendar } from "lucide-react";

function MyCompletedOrders() {
  const { currentUser } = useAuth();
  const [soldOrders, setSoldOrders] = useState([]);
  const [boughtOrders, setBoughtOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sold");

  useEffect(() => {
    if (!currentUser) return;

    async function fetchOrders() {
      try {
        const [soldSnap, boughtSnap] = await Promise.all([
          getDocs(query(collection(db, "completedOrders"), where("sellerId", "==", currentUser.uid))),
          getDocs(query(collection(db, "completedOrders"), where("buyerId", "==", currentUser.uid))),
        ]);

        const mapOrders = (snap) =>
          snap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .sort((a, b) => {
              const tA = a.completedAt?.toMillis ? a.completedAt.toMillis() : 0;
              const tB = b.completedAt?.toMillis ? b.completedAt.toMillis() : 0;
              return tB - tA;
            });

        setSoldOrders(mapOrders(soldSnap));
        setBoughtOrders(mapOrders(boughtSnap));
      } catch (err) {
        console.error("Error fetching completed orders:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [currentUser]);

  function formatDate(ts) {
    if (!ts?.toMillis) return "—";
    return new Date(ts.toMillis()).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const orders = activeTab === "sold" ? soldOrders : boughtOrders;

  return (
    <div className="marketplace" style={{ maxWidth: "900px", margin: "0 auto", minHeight: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          My Completed <span className="gradient-text">Orders</span>
        </h1>
        <p>A record of all your finished transactions on PeerMart.</p>
      </div>

      {/* Tab Toggle */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "var(--space-xl)",
          background: "var(--bg-card)",
          padding: "6px",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--border-subtle)",
          width: "fit-content",
        }}
      >
        <button
          onClick={() => setActiveTab("sold")}
          style={{
            padding: "10px 28px",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            background: activeTab === "sold" ? "var(--accent-gradient)" : "transparent",
            color: activeTab === "sold" ? "white" : "var(--text-secondary)",
          }}
        >
          <Tag size={15} />
          Sold ({soldOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("bought")}
          style={{
            padding: "10px 28px",
            borderRadius: "var(--radius-md)",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s",
            background: activeTab === "bought" ? "var(--accent-gradient)" : "transparent",
            color: activeTab === "bought" ? "white" : "var(--text-secondary)",
          }}
        >
          <ShoppingBag size={15} />
          Bought ({boughtOrders.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-2xl) 0" }}>
          <div className="loading-spinner"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ background: "rgba(74, 222, 128, 0.08)", color: "#4ade80" }}>
            {activeTab === "sold" ? <Tag size={32} /> : <ShoppingBag size={32} />}
          </div>
          <h3>No {activeTab === "sold" ? "sold" : "purchased"} orders yet</h3>
          <p>
            {activeTab === "sold"
              ? "Once you mark a reservation as complete, it will appear here."
              : "Once a seller marks your reservation as complete, it will show up here."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-md)" }}>
          {orders.map((order) => (
            <div
              key={order.id}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                overflow: "hidden",
                display: "flex",
              }}
            >
              {/* Item Image */}
              <div
                style={{
                  width: "110px",
                  flexShrink: 0,
                  borderRight: "1px solid var(--border-subtle)",
                  background: "var(--bg-darker)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                }}
              >
                {order.itemImage ? (
                  <img
                    src={order.itemImage}
                    alt={order.itemTitle}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                ) : (
                  <Package size={32} />
                )}
              </div>

              {/* Main Info */}
              <div style={{ flex: 1, padding: "var(--space-lg)", display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "1.1rem", color: "var(--text-primary)" }}>
                      {order.itemTitle}
                    </h3>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        fontFamily: "monospace",
                        background: "var(--bg-darker)",
                        padding: "2px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      {order.orderNumber}
                    </span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div className="gradient-text" style={{ fontWeight: "bold", fontSize: "1.15rem" }}>
                      ₹{order.itemPrice}
                    </div>
                    <div
                      style={{
                        marginTop: "4px",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "12px",
                        color: "#4ade80",
                        background: "rgba(74, 222, 128, 0.1)",
                        padding: "2px 10px",
                        borderRadius: "20px",
                      }}
                    >
                      <CheckCircle size={11} /> Completed
                    </div>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "var(--space-sm)" }}>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-lg)" }}>
                    {/* Counter-party info */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {activeTab === "sold" ? "Buyer" : "Seller"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-primary)" }}>
                        <User size={13} style={{ color: "var(--text-muted)" }} />
                        {activeTab === "sold" ? order.buyerName : order.sellerName}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        <Mail size={13} style={{ color: "var(--text-muted)" }} />
                        {activeTab === "sold" ? order.buyerEmail : order.sellerEmail}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-secondary)" }}>
                        <Phone size={13} style={{ color: "var(--accent-primary)" }} />
                        {activeTab === "sold" ? order.buyerPhone : order.sellerPhone}
                      </span>
                    </div>

                    {/* Date */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Completed On
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-primary)" }}>
                        <Calendar size={13} style={{ color: "var(--text-muted)" }} />
                        {formatDate(order.completedAt)}
                      </span>
                      {order.itemCategory && (
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                          Category: {order.itemCategory}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyCompletedOrders;
