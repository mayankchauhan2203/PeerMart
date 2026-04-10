import { useState, useEffect, useMemo } from "react";
import {
  collection, query, where, getDocs, doc, getDoc,
  updateDoc, deleteField, addDoc, serverTimestamp, orderBy, deleteDoc
} from "firebase/firestore";
import { db } from "../firebase";
import {
  Shield, Package, Phone, Mail, User, XCircle, CheckCircle,
  ClipboardList, Hash, Users, Search, Calendar, RefreshCw, UserX, UserCheck,
  AlertTriangle, Trash2, MessageSquare, Star
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
  const [queries, setQueries] = useState([]);
  const [queriesLoading, setQueriesLoading] = useState(true);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");

  // Search states
  const [userSearch, setUserSearch] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [completedSearch, setCompletedSearch] = useState("");
  const [reportsSearch, setReportsSearch] = useState("");

  // ── Filtered lists ────────────────────────────────────────────────────────
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

  const filteredOrders = useMemo(() => {
    const term = activeSearch.toLowerCase();
    if (!term) return orders;
    return orders.filter(o =>
      (o.title || "").toLowerCase().includes(term) ||
      (o.sellerName || "").toLowerCase().includes(term) ||
      (o.sellerEmail || "").toLowerCase().includes(term) ||
      (o.reservedByName || "").toLowerCase().includes(term) ||
      (o.reservedByEmail || "").toLowerCase().includes(term)
    );
  }, [orders, activeSearch]);

  const filteredCompleted = useMemo(() => {
    const term = completedSearch.toLowerCase();
    if (!term) return completedOrders;
    return completedOrders.filter(o =>
      (o.orderNumber || "").toLowerCase().includes(term) ||
      (o.itemTitle || "").toLowerCase().includes(term) ||
      (o.sellerName || "").toLowerCase().includes(term) ||
      (o.sellerEmail || "").toLowerCase().includes(term) ||
      (o.buyerName || "").toLowerCase().includes(term) ||
      (o.buyerEmail || "").toLowerCase().includes(term)
    );
  }, [completedOrders, completedSearch]);

  const filteredReports = useMemo(() => {
    const term = reportsSearch.toLowerCase();
    if (!term) return reports;
    return reports.filter(r =>
      (r.itemTitle || "").toLowerCase().includes(term) ||
      (r.reporterName || "").toLowerCase().includes(term) ||
      (r.reporterEmail || "").toLowerCase().includes(term) ||
      (r.sellerName || "").toLowerCase().includes(term) ||
      (r.sellerEmail || "").toLowerCase().includes(term) ||
      (r.message || "").toLowerCase().includes(term)
    );
  }, [reports, reportsSearch]);

  // ── Actions ────────────────────────────────────────────────────────────────
  async function handleBlockToggle(user) {
    const willBlock = !user.blocked;
    const action = willBlock ? "block" : "unblock";
    if (!window.confirm(`Are you sure you want to ${action} ${user.name || user.email || "this user"}?`)) return;
    try {
      await updateDoc(doc(db, "users", user.id), { blocked: willBlock });
      const sellerQ = query(collection(db, "items"), where("sellerId", "==", user.id));
      const sellerDocs = await getDocs(sellerQ);
      sellerDocs.forEach(async (d) => {
        await updateDoc(doc(db, "items", d.id), { sellerBlocked: willBlock });
      });
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

  async function handleResolveQuery(queryId) {
    try {
      await updateDoc(doc(db, "userQueries", queryId), { status: "resolved" });
      setQueries(prev => prev.map(q => q.id === queryId ? { ...q, status: "resolved" } : q));
      toast.success("Query marked as resolved.");
    } catch (e) {
      toast.error("Failed to update query.");
    }
  }

  async function handleDismissFeedback(feedbackId) {
    if (!window.confirm("Dismiss and delete this feedback?")) return;
    try {
      await deleteDoc(doc(db, "userFeedback", feedbackId));
      setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
      toast.success("Feedback dismissed.");
    } catch (e) {
      toast.error("Failed to dismiss feedback.");
    }
  }

  // ── Fetch functions ────────────────────────────────────────────────────────
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
      const snap = await getDocs(collection(db, "users"));
      const raw = snap.docs.map(d => ({ id: d.id, ...d.data() }));
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
        let reporterName = "Unknown", reporterEmail = "N/A", sellerName = "Unknown", sellerEmail = "N/A";
        try {
          if (data.reporterId) {
            const rd = await getDoc(doc(db, "users", data.reporterId));
            if (rd.exists()) { reporterName = rd.data().name || rd.data().email || "Unknown"; reporterEmail = rd.data().email || "N/A"; }
          }
        } catch (e) {}
        try {
          if (data.sellerId) {
            const sd = await getDoc(doc(db, "users", data.sellerId));
            if (sd.exists()) { sellerName = sd.data().name || sd.data().email || "Unknown"; sellerEmail = sd.data().email || "N/A"; }
          }
        } catch (e) {}
        return { id: docSnap.id, ...data, reporterName, reporterEmail, sellerName, sellerEmail };
      }));
      setReports(reportsData);
    } catch (e) {
      console.error(e);
    } finally {
      setReportsLoading(false);
    }
  }

  async function fetchQueries() {
    setQueriesLoading(true);
    try {
      const q = query(collection(db, "userQueries"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setQueries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setQueriesLoading(false);
    }
  }

  async function fetchFeedbacks() {
    setFeedbackLoading(true);
    try {
      const q = query(collection(db, "userFeedback"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error(e);
    } finally {
      setFeedbackLoading(false);
    }
  }

  async function fetchOrders() {
    setLoading(true);
    try {
      const q = query(collection(db, "items"), where("status", "==", "reserved"));
      const snapshot = await getDocs(q);
      const ordersData = await Promise.all(snapshot.docs.map(async (itemDoc) => {
        const item = { id: itemDoc.id, ...itemDoc.data() };
        let sellerPhone = "N/A", buyerPhone = "N/A";
        if (item.sellerId) {
          try {
            const s = await getDoc(doc(db, "users", item.sellerId));
            if (s.exists()) { sellerPhone = s.data().phone || "No phone"; item.sellerEntryNumber = s.data().entry_number || ""; }
          } catch (e) { console.error(e); }
        }
        if (item.reservedBy) {
          try {
            const b = await getDoc(doc(db, "users", item.reservedBy));
            if (b.exists()) { buyerPhone = b.data().phone || "No phone"; item.buyerEntryNumber = b.data().entry_number || ""; }
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

  useEffect(() => {
    fetchOrders();
    fetchCompletedOrders();
    fetchUsers();
    fetchReports();
    fetchQueries();
    fetchFeedbacks();
  }, []);

  const NAV_ITEMS = [
    { id: "active",    label: "Active Reservations", icon: <Package size={18} />,      count: orders.length },
    { id: "completed", label: "Completed Orders",     icon: <ClipboardList size={18} />, count: completedOrders.length },
    { id: "users",     label: "Users",                icon: <Users size={18} />,         count: users.length },
    { id: "reports",   label: "Reports",              icon: <AlertTriangle size={18} />, count: reports.length },
    { id: "queries",   label: "User Queries",         icon: <MessageSquare size={18} />, count: queries.filter(q => q.status === "open").length },
    { id: "feedback",  label: "User Feedback",        icon: <Star size={18} />,          count: feedbacks.length },
  ];

  const SearchBar = ({ value, onChange, placeholder }) => (
    <div className="admin-user-search" style={{ marginBottom: "var(--space-lg)" }}>
      <Search size={16} className="admin-user-search-icon" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="admin-user-search-input"
      />
    </div>
  );

  function formatDate(ts) {
    if (!ts) return "—";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  }

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
              <button className="admin-refresh-btn" onClick={fetchOrders} disabled={loading} title="Refresh">
                <RefreshCw size={15} className={loading ? "spinning" : ""} /> Refresh
              </button>
            </div>
            <SearchBar value={activeSearch} onChange={setActiveSearch} placeholder="Search by item title, seller or buyer name / email…" />
            {loading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : filteredOrders.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Package size={32} /></div>
                <h3>{activeSearch ? "No reservations match your search" : "No active reservations"}</h3>
                <p>{activeSearch ? "Try a different search term." : "There are no items currently awaiting mediation."}</p>
              </div>
            ) : (
              <div className="admin-orders-list">
                {filteredOrders.map(order => (
                  <div key={order.id} className="admin-order-card">
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading">Item Details</h3>
                      <div className="admin-item-row">
                        {order.image ? <img src={order.image} alt={order.title} className="admin-item-thumb" /> : <div className="admin-item-thumb-placeholder"><Package size={24} color="var(--text-muted)" /></div>}
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
                      <button className="admin-btn-cancel" onClick={() => handleUnreserve(order)}><XCircle size={15} /> Cancel &amp; Unreserve</button>
                      <button className="admin-btn-complete" onClick={() => handleMarkComplete(order)}><CheckCircle size={15} /> Mark as Complete</button>
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
            <SearchBar value={completedSearch} onChange={setCompletedSearch} placeholder="Search by order #, item title, seller or buyer…" />
            {completedLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : filteredCompleted.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><ClipboardList size={32} /></div>
                <h3>{completedSearch ? "No orders match your search" : "No completed orders yet"}</h3>
                <p>{completedSearch ? "Try a different search term." : "Completed transactions will appear here."}</p>
              </div>
            ) : (
              <div className="admin-orders-list">
                {filteredCompleted.map(order => (
                  <div key={order.id} className="admin-order-card admin-order-card--completed">
                    <div className="admin-order-number-row">
                      <Hash size={14} />
                      <span className="admin-order-number">{order.orderNumber}</span>
                      <span className="admin-order-date">{order.completedAt?.toDate ? order.completedAt.toDate().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recently"}</span>
                      <span className="admin-badge-sold">Sold</span>
                    </div>
                    <div className="admin-order-section">
                      <h3 className="admin-section-heading">Item Details</h3>
                      <div className="admin-item-row">
                        {order.itemImage ? <img src={order.itemImage} alt={order.itemTitle} className="admin-item-thumb" /> : <div className="admin-item-thumb-placeholder"><Package size={24} color="var(--text-muted)" /></div>}
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
              <button className="admin-refresh-btn" onClick={fetchUsers} disabled={usersLoading} title="Refresh user list">
                <RefreshCw size={15} className={usersLoading ? "spinning" : ""} /> Refresh
              </button>
            </div>
            <div className="admin-user-search">
              <Search size={16} className="admin-user-search-icon" />
              <input type="text" placeholder="Search by name, email, phone, or entry number..." value={userSearch} onChange={e => setUserSearch(e.target.value)} className="admin-user-search-input" />
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
                    <div className="admin-user-avatar">{(user.name || user.email || "?").charAt(0).toUpperCase()}</div>
                    <div className="admin-user-info">
                      <h4 className="admin-user-name">{user.name || "Unknown"}{user.blocked && <span className="admin-blocked-badge">Blocked</span>}</h4>
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
                      <button className={`admin-block-btn ${user.blocked ? "admin-block-btn--unblock" : ""}`} onClick={() => handleBlockToggle(user)} title={user.blocked ? "Unblock user" : "Block user"}>
                        {user.blocked ? <><UserCheck size={14} /> Unblock</> : <><UserX size={14} /> Block</>}
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
                <RefreshCw size={15} className={reportsLoading ? "spinning" : ""} /> Refresh
              </button>
            </div>
            <SearchBar value={reportsSearch} onChange={setReportsSearch} placeholder="Search by item title, reporter, seller, or message…" />
            {reportsLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : filteredReports.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><AlertTriangle size={32} /></div>
                <h3>{reportsSearch ? "No reports match your search" : "No reports"}</h3>
                <p>{reportsSearch ? "Try a different search term." : "No user reports have been submitted yet."}</p>
              </div>
            ) : (
              <div className="admin-reports-list">
                {filteredReports.map(report => (
                  <div key={report.id} className="admin-report-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)" }}>
                    <div style={{ flex: 1 }}>
                      <p className="admin-report-message">"{report.message}"</p>
                      <div className="admin-report-details">
                        <div><strong>Item:</strong> {report.itemTitle}</div>
                        <div><strong>Reporter:</strong> {report.reporterName} {report.reporterEmail !== "N/A" && `(${report.reporterEmail})`}</div>
                        <div><strong>Seller:</strong> {report.sellerName} {report.sellerEmail !== "N/A" && `(${report.sellerEmail})`}</div>
                        {report.createdAt && <div><strong>Date:</strong> {new Date(report.createdAt.toDate ? report.createdAt.toDate() : report.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>}
                      </div>
                    </div>
                    <button className="admin-block-btn" onClick={() => handleDeleteReport(report.id)} title="Delete Report" style={{ margin: 0, padding: "8px", borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "var(--bg-secondary)" }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── User Queries ────────────────────────────────────────────────── */}
        {activeTab === "queries" && (
          <div>
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">User Queries</h2>
                <p className="admin-panel-desc">Issues and questions raised by users directly to admins.</p>
              </div>
              <button className="admin-refresh-btn" onClick={fetchQueries} disabled={queriesLoading}>
                <RefreshCw size={15} className={queriesLoading ? "spinning" : ""} /> Refresh
              </button>
            </div>
            {queriesLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : queries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><MessageSquare size={32} /></div>
                <h3>No queries yet</h3>
                <p>User-submitted issues will appear here.</p>
              </div>
            ) : (
              <div className="admin-reports-list">
                {queries.map(q => (
                  <div key={q.id} className="admin-report-card" style={{ opacity: q.status === "resolved" ? 0.55 : 1, transition: "opacity 0.2s" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                          <strong style={{ color: "var(--text-primary)", fontSize: "15px" }}>{q.subject}</strong>
                          {q.status === "resolved"
                            ? <span style={{ fontSize: "11px", color: "#4ade80", background: "rgba(74,222,128,0.1)", padding: "2px 8px", borderRadius: "20px" }}>Resolved</span>
                            : <span style={{ fontSize: "11px", color: "var(--accent-primary)", background: "rgba(244,163,0,0.1)", padding: "2px 8px", borderRadius: "20px" }}>Open</span>}
                        </div>
                        <p style={{ color: "var(--text-secondary)", margin: "0 0 8px 0", lineHeight: 1.5 }}>{q.message}</p>
                        <div className="admin-report-details">
                          <div><strong>From:</strong> {q.userName || "Unknown"} {q.userEmail && `(${q.userEmail})`}</div>
                          {q.createdAt && <div><strong>Date:</strong> {formatDate(q.createdAt)}</div>}
                        </div>
                      </div>
                      {q.status !== "resolved" && (
                        <button className="admin-block-btn admin-block-btn--unblock" onClick={() => handleResolveQuery(q.id)} style={{ flexShrink: 0 }}>
                          <CheckCircle size={14} /> Resolve
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── User Feedback ────────────────────────────────────────────────── */}
        {activeTab === "feedback" && (
          <div>
            <div className="admin-panel-header">
              <div>
                <h2 className="admin-panel-title">User Feedback</h2>
                <p className="admin-panel-desc">General feedback submitted by the community about PeerMart.</p>
              </div>
              <button className="admin-refresh-btn" onClick={fetchFeedbacks} disabled={feedbackLoading}>
                <RefreshCw size={15} className={feedbackLoading ? "spinning" : ""} /> Refresh
              </button>
            </div>
            {feedbackLoading ? (
              <div className="admin-center"><div className="loading-spinner" /></div>
            ) : feedbacks.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon"><Star size={32} /></div>
                <h3>No feedback yet</h3>
                <p>Community feedback will appear here when submitted.</p>
              </div>
            ) : (
              <div className="admin-reports-list">
                {feedbacks.map(fb => (
                  <div key={fb.id} className="admin-report-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--space-md)" }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: "var(--text-secondary)", margin: "0 0 8px 0", lineHeight: 1.5, fontStyle: "italic" }}>"{fb.message}"</p>
                      <div className="admin-report-details">
                        <div><strong>From:</strong> {fb.userName || "Anonymous"} {fb.userEmail && `(${fb.userEmail})`}</div>
                        {fb.createdAt && <div><strong>Date:</strong> {formatDate(fb.createdAt)}</div>}
                      </div>
                    </div>
                    <button className="admin-block-btn" onClick={() => handleDismissFeedback(fb.id)} title="Dismiss" style={{ margin: 0, padding: "8px", borderColor: "var(--border-subtle)", color: "var(--text-secondary)", background: "var(--bg-secondary)", flexShrink: 0 }}>
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
