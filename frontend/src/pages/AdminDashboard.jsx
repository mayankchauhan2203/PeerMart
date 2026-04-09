import { useState, useEffect, useMemo } from "react";
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, deleteField, addDoc, serverTimestamp, orderBy, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Shield, Package, Phone, Mail, User, XCircle, CheckCircle,
  ClipboardList, Hash, Users, Search, Calendar, RefreshCw, UserX, UserCheck, AlertTriangle, Trash2
} from "lucide-react";
import toast from "react-hot-toast";

function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const randPart = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PM-${datePart}-${randPart}`;
}

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedLoading, setCompletedLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [userSearch, setUserSearch] = useState("");

  // Filter users by search term
  const filteredUsers = useMemo(() => {
    const term = userSearch.toLowerCase();
    if (!term) return users;
    return users.filter(u =>
      (u.name || "").toLowerCase().includes(term) ||
      (u.email || "").toLowerCase().includes(term) ||
      (u.phone || "").toLowerCase().includes(term) ||
      (u.kerberos_id || "").toLowerCase().includes(term) ||
      (u.entry_number || "").toLowerCase().includes(term)
    );
  }, [users, userSearch]);

  async function handleBlockToggle(user) {
    const willBlock = !user.blocked;
    const action = willBlock ? "block" : "unblock";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name || user.email || "this user"}?`)) return;
    try {
      await updateDoc(doc(db, "users", user.id), { blocked: willBlock });

      // Update their listed items so they don't show in the marketplace
      const sellerQ = query(collection(db, "items"), where("sellerId", "==", user.id));
      const sellerDocs = await getDocs(sellerQ);
      sellerDocs.forEach(async (d) => {
        await updateDoc(doc(db, "items", d.id), { sellerBlocked: willBlock });
      });

      // If blocking, cancel all their reservations
      if (willBlock) {
        const reservedQ = query(collection(db, "items"), where("reservedBy", "==", user.id));
        const reservedDocs = await getDocs(reservedQ);
        reservedDocs.forEach(async (d) => {
          await updateDoc(doc(db, "items", d.id), {
            status: "available",
            reservedBy: deleteField(),
            reservedByName: deleteField(),
            reservedByEmail: deleteField()
          });
        });
        // Optimistically remove these orders from the UI
        setOrders(prev => prev.filter(o => o.reservedBy !== user.id));
      }

      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, blocked: willBlock } : u));
      toast.success(`User ${willBlock ? "blocked" : "unblocked"} successfully.`);
    } catch (e) {
      console.error(e);
      toast.error(`Failed to ${action} user.`);
    }
  }

  async function handleUnreserve(order) {
    if (!window.confirm("Cancel this reservation? The item will be made available again.")) return;
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
      console.error(error);
      toast.error("Failed to cancel reservation");
    }
  }

  async function handleMarkComplete(order) {
    if (!window.confirm("Mark this transaction as complete? This finalises the sale.")) return;
    try {
      await updateDoc(doc(db, "items", order.id), { status: "sold" });

      const orderNumber = generateOrderNumber();
      await addDoc(collection(db, "completedOrders"), {
        orderNumber,
        itemId: order.id,
        itemTitle: order.title,
        itemPrice: order.price,
        itemImage: order.image || null,
        itemCategory: order.category || null,
        sellerId: order.sellerId || null,
        sellerName: order.sellerName || "Unknown",
        sellerEmail: order.sellerEmail || "N/A",
        sellerPhone: order.sellerPhone || "N/A",
        sellerEntryNumber: order.sellerEntryNumber || "",
        buyerId: order.reservedBy || null,
        buyerName: order.reservedByName || "Unknown",
        buyerEmail: order.reservedByEmail || "N/A",
        buyerPhone: order.buyerPhone || "N/A",
        buyerEntryNumber: order.buyerEntryNumber || "",
        completedAt: serverTimestamp(),
      });

      setOrders(prev => prev.filter(o => o.id !== order.id));
      toast.success(`Done! Order #${orderNumber}`);
      fetchCompletedOrders();
    } catch (error) {
      console.error(error);
      toast.error("Failed to mark as complete");
    }
  }

  async function fetchCompletedOrders() {
    setCompletedLoading(true);
    try {
      const q = query(collection(db, "completedOrders"), orderBy("completedAt", "desc"));
      const snap = await getDocs(q);
      setCompletedOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setCompletedLoading(false);
    }
  }

  async function fetchUsers() {
    setUsersLoading(true);
    try {
      // Fetch all user docs — sorted by createdAt desc (newest first)
      const snap = await getDocs(collection(db, "users"));
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by createdAt desc; fall back to updatedAt for older accounts
      raw.sort((a, b) => {
        const ta = a.createdAt || a.updatedAt || "";
        const tb = b.createdAt || b.updatedAt || "";
        return tb.localeCompare(ta);
      });
      setUsers(raw);
    } catch (e) {
      console.error(e);
    } finally {
      setUsersLoading(false);
    }
  }

  async function fetchReports() {
    setReportsLoading(true);
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const reportsData = await Promise.all(snap.docs.map(async (docSnap) => {
        const data = docSnap.data();
        let reporterName = "Unknown";
        let sellerName = "Unknown";
        try {
          if (data.reporterId) {
            const rd = await getDoc(doc(db, "users", data.reporterId));
            if (rd.exists()) reporterName = rd.data().name || rd.data().email || "Unknown";
          }
        } catch (e) {}
        try {
          if (data.sellerId) {
            const sd = await getDoc(doc(db, "users", data.sellerId));
            if (sd.exists()) sellerName = sd.data().name || sd.data().email || "Unknown";
          }
        } catch (e) {}
        return { id: docSnap.id, ...data, reporterName, sellerName };
      }));
      setReports(reportsData);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  }

  async function handleDeleteReport(reportId) {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setReports(prev => prev.filter(r => r.id !== reportId));
      toast.success("Report deleted successfully.");
    } catch (error) {
      console.error("Error deleting report:", error);
      toast.error("Failed to delete report.");
    }
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const q = query(collection(db, "items"), where("status", "==", "reserved"));
      const snapshot = await getDocs(q);

      const ordersData = await Promise.all(snapshot.docs.map(async (itemDoc) => {
        const item = { id: itemDoc.id, ...itemDoc.data() };
        let sellerPhone = "N/A";
        let buyerPhone = "N/A";
        if (item.sellerId) {
          try {
            const s = await getDoc(doc(db, "users", item.sellerId));
            if (s.exists()) {
              sellerPhone = s.data().phone || "No phone";
              item.sellerEntryNumber = s.data().entry_number || "";
            }
          } catch (e) { console.error(e); }
        }
        if (item.reservedBy) {
          try {
            const b = await getDoc(doc(db, "users", item.reservedBy));
            if (b.exists()) {
              buyerPhone = b.data().phone || "No phone";
              item.buyerEntryNumber = b.data().entry_number || "";
            }
          } catch (e) { console.error(e); }
        }
        return { ...item, sellerPhone, buyerPhone };
      }));

      setOrders(ordersData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {

    fetchOrders();
    fetchCompletedOrders();
    fetchUsers();
    fetchReports();
  }, []);

  const NAV_ITEMS = [
    { id: "active",    label: "Active Reservations", icon: <Package size={18} />,     count: orders.length },
    { id: "completed", label: "Completed Orders",     icon: <ClipboardList size={18} />, count: completedOrders.length },
    { id: "users",     label: "Users",                icon: <Users size={18} />,        count: users.length },
    { id: "reports",   label: "Reports",              icon: <AlertTriangle size={18} />, count: reports.length },
  ];

  return (
    <div className="admin-layout">
      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <div className="admin-icon"><Shield size={20} color="white" /></div>
          <div>
            <div className="admin-sidebar-title">Admin</div>
            <div className="admin-sidebar-sub">Dashboard</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`admin-nav-item ${activeTab === item.id ? "admin-nav-item--active" : ""}`}
              onClick={() => setActiveTab(item.id)}
            >
              <span className="admin-nav-icon">{item.icon}</span>
              <span className="admin-nav-label">{item.label}</span>
              <span className="admin-nav-count">{item.count}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <main className="admin-main">
        {/* ── Active Reservations ──────────────────────────────────────── */}
        {activeTab === "active" && (
          <div>
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Active Reservations</h2>
                <p className="admin-panel-desc">Items currently reserved — mediate and confirm or cancel.</p>
              </div>
              <button
                className="admin-refresh-btn"
                onClick={fetchOrders}
                disabled={loading}
                title="Refresh active reservations"
              >
                <RefreshCw size={15} className={loading ? "spinning" : ""} />
                Refresh
              </button>
            </div>
            {loading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
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
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading">Item Details</h3>
                      <div className="admin-item-row">
                        {order.image
                          ? <img src={order.image} alt={order.title} className="admin-item-thumb" />
                          : <div className="admin-item-thumb-placeholder"><Package size={24} color="var(--text-muted)" /></div>}
                        <div>
                          <h4 className="admin-item-title">{order.title}</h4>
                          <span className="admin-item-price">₹{order.price}</span>
                          <p className="admin-item-category">Category: {order.category}</p>
                        </div>
                      </div>
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading"><User size={15} /> Seller (Owner)</h3>
                      <p className="admin-contact-name">{order.sellerName || "Unknown"}</p>
                      <p className="admin-contact-detail"><Mail size={13} /> {order.sellerEmail || "N/A"}</p>
                      <p className="admin-contact-detail"><Phone size={13} /> {order.sellerPhone}</p>
                      {order.sellerEntryNumber && <p className="admin-contact-detail" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry: {order.sellerEntryNumber.toUpperCase()}</p>}
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading"><User size={15} /> Buyer (Reserved By)</h3>
                      <p className="admin-contact-name">{order.reservedByName || "Unknown"}</p>
                      <p className="admin-contact-detail"><Mail size={13} /> {order.reservedByEmail || "N/A"}</p>
                      <p className="admin-contact-detail"><Phone size={13} /> {order.buyerPhone}</p>
                      {order.buyerEntryNumber && <p className="admin-contact-detail" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry: {order.buyerEntryNumber.toUpperCase()}</p>}
                    </div>
                    <div className="admin-order-actions">
                      <button className="admin-btn-cancel" onClick={() => handleUnreserve(order)}>
                        <XCircle size={15} /> Cancel &amp; Unreserve
                      </button>
                      <button className="admin-btn-complete" onClick={() => handleMarkComplete(order)}>
                        <CheckCircle size={15} /> Mark as Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Completed Orders ─────────────────────────────────────────── */}
        {activeTab === "completed" && (
          <div>
            <h2 className="admin-panel-title">Completed Orders</h2>
            <p className="admin-panel-desc">All finalised transactions with unique order numbers.</p>
            {completedLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : completedOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ClipboardList size={32} /></div>
                <h3>No completed orders yet</h3>
                <p>Completed transactions will appear here.</p>
              </div>
            ) : (
              <div className="admin-orders-list">
                {completedOrders.map(order => (
                  <div key={order.id} className="admin-order-card admin-order-card--completed">
                    <div className="admin-order-number-row">
                      <Hash size={14} />
                      <span className="admin-order-number">{order.orderNumber}</span>
                      <span className="admin-order-date">
                        {order.completedAt?.toDate
                          ? order.completedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                          : "Recently"}
                      </span>
                      <span className="admin-badge-sold">Sold</span>
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading">Item Details</h3>
                      <div className="admin-item-row">
                        {order.itemImage
                          ? <img src={order.itemImage} alt={order.itemTitle} className="admin-item-thumb" />
                          : <div className="admin-item-thumb-placeholder"><Package size={24} color="var(--text-muted)" /></div>}
                        <div>
                          <h4 className="admin-item-title">{order.itemTitle}</h4>
                          <span className="admin-item-price">₹{order.itemPrice}</span>
                          {order.itemCategory && <p className="admin-item-category">Category: {order.itemCategory}</p>}
                        </div>
                      </div>
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading"><User size={15} /> Seller</h3>
                      <p className="admin-contact-name">{order.sellerName}</p>
                      <p className="admin-contact-detail"><Mail size={13} /> {order.sellerEmail}</p>
                      <p className="admin-contact-detail"><Phone size={13} /> {order.sellerPhone}</p>
                      {order.sellerEntryNumber && <p className="admin-contact-detail" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry: {order.sellerEntryNumber.toUpperCase()}</p>}
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading"><User size={15} /> Buyer</h3>
                      <p className="admin-contact-name">{order.buyerName}</p>
                      <p className="admin-contact-detail"><Mail size={13} /> {order.buyerEmail}</p>
                      <p className="admin-contact-detail"><Phone size={13} /> {order.buyerPhone}</p>
                      {order.buyerEntryNumber && <p className="admin-contact-detail" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Entry: {order.buyerEntryNumber.toUpperCase()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Users ────────────────────────────────────────────────────── */}
        {activeTab === "users" && (
          <div>
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Users</h2>
                <p className="admin-panel-desc">All registered users — newest first.</p>
              </div>
              <button
                className="admin-refresh-btn"
                onClick={fetchUsers}
                disabled={usersLoading}
                title="Refresh user list"
              >
                <RefreshCw size={15} className={usersLoading ? "spinning" : ""} />
                Refresh
              </button>
            </div>

            {/* Search bar */}
            <div className="admin-user-search">
              <Search size={16} className="admin-user-search-icon" />
              <input
                type="text"
                placeholder="Search by name, email, phone, or entry number..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="admin-user-search-input"
              />
            </div>

            {usersLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Users size={32} /></div>
                <h3>{userSearch ? "No users match your search" : "No users found"}</h3>
                <p>{userSearch ? "Try a different search term." : "Users will appear here after they register."}</p>
              </div>
            ) : (
              <div className="admin-users-list">
                {filteredUsers.map(user => (
                  <div key={user.id} className={`admin-user-card ${user.blocked ? "admin-user-card--blocked" : ""}`}>
                    <div className="admin-user-avatar">
                      {(user.name || user.email || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-user-info">
                      <h4 className="admin-user-name">
                        {user.name || "Unknown"}
                        {user.blocked && <span className="admin-blocked-badge">Blocked</span>}
                      </h4>
                      <p className="admin-contact-detail"><Mail size={13} /> {user.email || "N/A"}</p>
                      {user.phone && <p className="admin-contact-detail"><Phone size={13} /> {user.phone}</p>}
                      {(user.entry_number || user.department || user.hostel) && (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: 'var(--text-muted)', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 8px' }}>
                          {user.entry_number && <><span style={{fontWeight:600}}>Entry:</span><span>{user.entry_number.toUpperCase()}</span></>}
                          {user.department && <><span style={{fontWeight:600}}>Dept:</span><span>{user.department}</span></>}
                          {user.hostel && <><span style={{fontWeight:600}}>Hostel:</span><span>{user.hostel}</span></>}
                        </div>
                      )}
                      {user.bio && <p className="admin-user-bio">{user.bio}</p>}
                    </div>
                    <div className="admin-user-meta">
                      {(user.createdAt || user.updatedAt) && (
                        <span className="admin-user-joined">
                          <Calendar size={12} />
                          {new Date(user.createdAt || user.updatedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </span>
                      )}
                      <button
                        className={`admin-block-btn ${user.blocked ? "admin-block-btn--unblock" : ""}`}
                        onClick={() => handleBlockToggle(user)}
                        title={user.blocked ? "Unblock user" : "Block user"}
                      >
                        {user.blocked
                          ? <><UserCheck size={14} /> Unblock</>
                          : <><UserX size={14} /> Block</>
                        }
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Reports ────────────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <div>
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">Reports</h2>
                <p className="admin-panel-desc">All item reports submitted by users.</p>
              </div>
              <button className="admin-refresh-btn" onClick={fetchReports} disabled={reportsLoading}>
                <RefreshCw size={15} className={reportsLoading ? "spinning" : ""} />
                Refresh
              </button>
            </div>
            
            {reportsLoading ? (
               <div className="admin-center"><div className="loading-spinner" /></div>
            ) : reports.length === 0 ? (
               <div className="empty-state">
                 <div className="empty-icon"><AlertTriangle size={32} /></div>
                 <h3>No reports</h3>
                 <p>No user reports have been submitted yet.</p>
               </div>
            ) : (
               <div className="admin-reports-list">
                 {reports.map(report => (
                   <div key={report.id} className="admin-report-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)" }}>
                     <div style={{ flex: 1 }}>
                       <p className="admin-report-message">"{report.message}"</p>
                       <div className="admin-report-details">
                         <div><strong>Item:</strong> {report.itemTitle}</div>
                         <div><strong>Reporter:</strong> {report.reporterName}</div>
                         <div><strong>Seller:</strong> {report.sellerName}</div>
                         {report.createdAt && <div><strong>Date:</strong> {new Date(report.createdAt.toDate ? report.createdAt.toDate() : report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                       </div>
                     </div>
                     <button
                       className="admin-block-btn"
                       onClick={() => handleDeleteReport(report.id)}
                       title="Delete Report"
                       style={{ margin: 0, padding: "8px", borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}
                     >
                       <Trash2 size={16} />
                     </button>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
