import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, updateDoc, addDoc, collection, serverTimestamp, query, where, getDocs, deleteField, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { Package, ShoppingCart, CheckCircle, User, ArrowLeft, AlertTriangle, Trash2, XCircle, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import toast from "react-hot-toast";

function loadRazorpay() {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
}

function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, isBlocked, isAdmin } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReserveModal, setShowReserveModal] = useState(false);
  const [reservePhone, setReservePhone] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [razorpayLoading, setRazorpayLoading] = useState(false);

  const [showReportModal, setShowReportModal] = useState(false);
  const [reportMessage, setReportMessage] = useState("");
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  // Seller contact — only fetched when the viewer is authorised to see it
  const [sellerContact, setSellerContact] = useState(null);

  // ── Carousel state ──────────────────────────────────────────────────────
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const touchStartX = useRef(null);

  useEffect(() => {
    async function fetchItem() {
      try {
        const itemSnap = await getDoc(doc(db, "items", id));
        if (itemSnap.exists()) {
          const itemData = { id: itemSnap.id, ...itemSnap.data() };
          setItem(itemData);


          if (currentUser) {
            const q = query(
              collection(db, "reports"),
              where("itemId", "==", id),
              where("reporterId", "==", currentUser.uid)
            );
            getDocs(q).then(reportSnap => {
              if (!reportSnap.empty) setHasReported(true);
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
  }, [id, navigate, isAdmin]);

  // Fetches the private contact doc whenever the viewer's auth or the item's
  // reservation state changes.  For buyers we first merge {reservedBy} into the
  // subcollection so the read rule passes even on re-visits or legacy items.
  useEffect(() => {
    if (!item || !currentUser) return;
    const isSeller = item.sellerId === currentUser.uid;
    const isBuyer  = item.reservedBy === currentUser.uid;
    if (!isSeller && !isBuyer && !isAdmin) return;

    const contactRef = doc(db, "items", item.id, "private", "contact");

    (async () => {
      try {
        if (isBuyer) {
          // Ensure reservedBy exists in the subcollection before reading.
          // setDoc+merge is idempotent and creates the doc when it doesn't exist.
          await setDoc(contactRef, { reservedBy: currentUser.uid }, { merge: true });
        }
        const snap = await getDoc(contactRef);
        if (snap.exists()) setSellerContact(snap.data());
      } catch (e) {
        console.error("Error fetching seller contact:", e);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, item?.reservedBy, item?.sellerId, currentUser?.uid, isAdmin]);

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

      const executeReservation = async () => {
        if (reservePhone !== userData?.phone) {
          const userRef = doc(db, "users", currentUser.uid);
          await updateDoc(userRef, { phone: reservePhone });
        }

        const itemRef = doc(db, "items", item.id);
        await updateDoc(itemRef, {
          status: "reserved",
          reservedBy: currentUser.uid,
          reservedByName: userData?.name || currentUser.displayName || "Student User",
          reservedByEmail: userData?.email || currentUser.email || "N/A",
          reservedByPhone: reservePhone,
          reservedAt: serverTimestamp(),
        });

        // Seller Notification
        await addDoc(collection(db, "notifications"), {
          recipientId: item.sellerId,
          type: "reservation",
          itemId: item.id,
          itemTitle: item.title,
          itemPrice: item.price,
          buyerName: currentUser.displayName || "Student User",
          read: false,
          createdAt: serverTimestamp(),
        });

        // Buyer Notification
        await addDoc(collection(db, "notifications"), {
          recipientId: currentUser.uid,
          type: "reservation_buyer_confirm",
          itemId: item.id,
          itemTitle: item.title,
          sellerId: item.sellerId,
          read: false,
          createdAt: serverTimestamp(),
        });

        // Merge reservedBy into the subcollection.
        // setDoc+merge creates the doc for legacy listings (no subcollection yet)
        // and updates it for new listings — no race condition, no "doc not found" throw.
        const contactRef = doc(db, "items", item.id, "private", "contact");
        await setDoc(contactRef, { reservedBy: currentUser.uid }, { merge: true });

        // Now the rule passes — fetch the full contact doc (includes sellerPhone)
        const contactSnap = await getDoc(contactRef);
        if (contactSnap.exists()) setSellerContact(contactSnap.data());

        setItem(prev => ({
          ...prev,
          status: "reserved",
          reservedBy: currentUser.uid,
          reservedByName: currentUser.displayName || "Student User",
          reservedByEmail: currentUser.email,
          reservedByPhone: reservePhone
        }));

        toast.success("Item reserved successfully!");
        setShowReserveModal(false);
      };

      const requiresPayment = item.price > 0;

      if (requiresPayment) {
        setRazorpayLoading(true);
        const res = await loadRazorpay();
        if (!res) {
          toast.error("Razorpay SDK failed to load. Are you online?");
          setRazorpayLoading(false);
          return;
        }

        const orderData = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/razorpay/order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: item.price })
        }).then(t => t.json());

        if (orderData.error) {
          toast.error("Could not create payment order");
          setRazorpayLoading(false);
          return;
        }

        const options = {
          key: process.env.REACT_APP_RAZORPAY_KEY_ID,
          amount: orderData.amount,
          currency: orderData.currency,
          name: "PeerMart",
          description: "Reservation Fee for " + item.title,
          order_id: orderData.id,
          handler: async function (response) {
            try {
              const verifyRes = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5000"}/api/razorpay/verify`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                })
              }).then(t => t.json());

              if (verifyRes.verified) {
                await executeReservation();
              } else {
                toast.error("Payment verification failed! Contact support.");
              }
            } catch (err) {
              console.error(err);
              toast.error("Error during payment verification");
            } finally {
              setRazorpayLoading(false);
            }
          },
          prefill: {
            name: currentUser.displayName || "",
            email: currentUser.email || "",
            contact: reservePhone || ""
          },
          theme: {
            color: "#f4a300"
          }
        };

        const paymentObject = new window.Razorpay(options);
        paymentObject.on("payment.failed", function (response) {
          toast.error(response.error.description || "Payment failed");
          setRazorpayLoading(false);
        });
        paymentObject.open();

      } else {
        await executeReservation();
      }

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

      // Clear reservedBy from the private subcollection
      await updateDoc(doc(db, "items", item.id, "private", "contact"), {
        reservedBy: deleteField(),
      }).catch(() => {});
      setSellerContact(null);

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

        {/* ── Image Carousel ── */}
        <div className="item-details-image-wrap" style={{ position: "relative", overflow: "hidden" }}>
          {(() => {
            const imgs = item.images?.length ? item.images : (item.image ? [item.image] : []);
            if (imgs.length === 0) return <Package size={64} color="var(--text-muted)" />;

            const prev = () => setActiveImg(i => (i - 1 + imgs.length) % imgs.length);
            const next = () => setActiveImg(i => (i + 1) % imgs.length);

            return (
              <>
                {/* Main image */}
                <div
                  style={{ position: "relative", width: "100%", cursor: "zoom-in" }}
                  onClick={() => setLightbox(true)}
                  onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={e => {
                    if (touchStartX.current === null) return;
                    const diff = touchStartX.current - e.changedTouches[0].clientX;
                    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
                    touchStartX.current = null;
                  }}
                >
                  <img
                    src={imgs[activeImg]}
                    alt={`${item.title} — photo ${activeImg + 1}`}
                    className="item-details-img"
                    style={{ userSelect: "none", transition: "opacity 0.18s" }}
                  />
                  {/* Zoom hint */}
                  <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.55)", borderRadius: "50%", padding: 7, display: "flex", pointerEvents: "none" }}>
                    <ZoomIn size={16} color="white" />
                  </div>
                </div>

                {/* Arrows — only if multiple images */}
                {imgs.length > 1 && (
                  <>
                    <button onClick={prev} aria-label="Previous" style={{
                      position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
                      width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", zIndex: 2, color: "white"
                    }}><ChevronLeft size={20} /></button>
                    <button onClick={next} aria-label="Next" style={{
                      position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                      background: "rgba(0,0,0,0.55)", border: "none", borderRadius: "50%",
                      width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", zIndex: 2, color: "white"
                    }}><ChevronRight size={20} /></button>

                    {/* Dot indicators */}
                    <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 6 }}>
                      {imgs.map((_, i) => (
                        <button key={i} onClick={() => setActiveImg(i)} aria-label={`Go to photo ${i + 1}`} style={{
                          width: i === activeImg ? 18 : 8, height: 8,
                          borderRadius: 4, border: "none", padding: 0, cursor: "pointer",
                          background: i === activeImg ? "var(--accent-primary)" : "rgba(255,255,255,0.45)",
                          transition: "all 0.2s"
                        }} />
                      ))}
                    </div>
                  </>
                )}

                {/* Status badge */}
                <span className={`product-card-badge ${item.status === "available" ? "badge-available" : "badge-reserved"}`}>
                  {item.status === "available" ? "Available" : "Reserved"}
                </span>

                {/* Lightbox */}
                {lightbox && (
                  <div
                    onClick={() => setLightbox(false)}
                    style={{
                      position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)",
                      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    <button onClick={e => { e.stopPropagation(); setLightbox(false); }} aria-label="Close" style={{
                      position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.1)",
                      border: "none", borderRadius: "50%", width: 40, height: 40,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", color: "white"
                    }}><X size={20} /></button>

                    <img
                      src={imgs[activeImg]}
                      alt={`${item.title} — full size`}
                      style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 8 }}
                      onClick={e => e.stopPropagation()}
                    />

                    {imgs.length > 1 && (
                      <>
                        <button onClick={e => { e.stopPropagation(); prev(); }} aria-label="Previous" style={{
                          position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
                          width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "white"
                        }}><ChevronLeft size={24} /></button>
                        <button onClick={e => { e.stopPropagation(); next(); }} aria-label="Next" style={{
                          position: "absolute", right: 16, top: "50%", transform: "translateY(-50%)",
                          background: "rgba(255,255,255,0.1)", border: "none", borderRadius: "50%",
                          width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "white"
                        }}><ChevronRight size={24} /></button>
                        <div style={{ position: "absolute", bottom: 24, left: "50%", transform: "translateX(-50%)", color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                          {activeImg + 1} / {imgs.length}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            );
          })()}
        </div>

        {/* Details */}
        <div className="item-details-info">
          <div>
            <span className="item-details-category">{item.category}</span>
            <h1 className="item-details-title">{item.title}</h1>
            <div className="item-details-price">₹{item.price}</div>
          </div>

          <div className="item-details-description">
            <h3 className="item-details-desc-heading">Description</h3>
            <p className="item-details-desc-text">
              {item.description || "No description provided by the seller."}
            </p>
          </div>

          {/* Admin-only: Seller Info */}
          {isAdmin && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "var(--space-md) var(--space-lg)",
              background: "rgba(244,163,0,0.06)",
              border: "1px solid rgba(244,163,0,0.25)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-sm)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: "14px", fontWeight: 700, color: "#000"
              }}>
                {(item.sellerName || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "var(--accent-primary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Listed by (Admin View)
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {item.sellerName || "Unknown"}
                </p>
                {item.sellerEmail && (
                  <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    📧 <a href={`mailto:${item.sellerEmail}`} style={{ color: "var(--text-muted)" }}>{item.sellerEmail}</a>
                  </p>
                )}
                {(sellerContact?.sellerPhone || item.sellerPhone) ? (
                  <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    📞 <a href={`tel:${sellerContact?.sellerPhone || item.sellerPhone}`} style={{ color: "var(--text-muted)" }}>{sellerContact?.sellerPhone || item.sellerPhone}</a>
                  </p>
                ) : (
                  <p style={{ margin: "1px 0 0", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No phone on record
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Seller contact — shown to the reserved buyer only */}
          {!isAdmin && item.reservedBy === currentUser?.uid && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "var(--space-md) var(--space-lg)",
              background: "rgba(34,197,94,0.06)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: "var(--radius-md)",
              marginBottom: "var(--space-sm)",
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: "var(--accent-gradient)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, fontSize: "14px", fontWeight: 700, color: "#000"
              }}>
                {(item.sellerName || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "11px", color: "rgb(34,197,94)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Seller Contact
                </p>
                <p style={{ margin: "2px 0 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  {item.sellerName || "Unknown"}
                </p>
                {item.sellerEmail && (
                  <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    📧 <a href={`mailto:${item.sellerEmail}`} style={{ color: "var(--text-muted)" }}>{item.sellerEmail}</a>
                  </p>
                )}
                {(sellerContact?.sellerPhone || item.sellerPhone) ? (
                  <p style={{ margin: "1px 0 0", fontSize: "12px", color: "var(--text-muted)" }}>
                    📞 <a href={`tel:${sellerContact?.sellerPhone || item.sellerPhone}`} style={{ color: "var(--text-muted)" }}>{sellerContact?.sellerPhone || item.sellerPhone}</a>
                  </p>
                ) : (
                  <p style={{ margin: "1px 0 0", fontSize: "11px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    No phone on record
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="item-details-action">
            {item.sellerId === currentUser?.uid ? (
              <button className="buy-btn item-details-btn" disabled>
                <User size={20} />
                This is your listing
              </button>
            ) : item.status === "available" ? (
              <>
                {/* Reservation fee note */}
                {item.sellerId !== currentUser?.uid && (
                  <div style={{
                    display: "flex", alignItems: "flex-start", gap: "8px",
                    padding: "10px 14px",
                    background: "rgba(244,163,0,0.06)",
                    border: "1px solid rgba(244,163,0,0.2)",
                    borderRadius: "var(--radius-md)",
                    marginBottom: "var(--space-sm)",
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    lineHeight: 1.5,
                  }}>
                    <span style={{ color: "var(--accent-primary)", fontWeight: 700, flexShrink: 0 }}>ℹ</span>
                    <span>
                      A reservation fee of{" "}
                      <strong style={{ color: "var(--accent-primary)" }}>
                        ₹{item.price > 1000 ? 30 : Math.round(item.price * 0.03)}
                      </strong>
                      {" "}(3% of price, max ₹30) is charged to lock this item. To know more, visit our{" "}
                      <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "var(--accent-primary)", textDecoration: "underline" }}>Terms of Service</a>
                      {" "}page.
                    </span>
                  </div>
                )}
                <button
                  className="btn btn-primary item-details-btn"
                  onClick={handleReserveClick}
                  disabled={isBlocked || hasReported}
                >
                  <ShoppingCart size={20} />
                  {hasReported ? "Cannot reserve (Reported)" : "Reserve Now"}
                </button>
              </>
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
                <button type="button" className="btn-cancel" onClick={() => setShowReserveModal(false)} disabled={razorpayLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={razorpayLoading}>
                  {razorpayLoading ? "Processing..." : "Pay & Confirm"}
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
