import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, Package, PlusCircle, CheckCircle, User } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Electronics", "Books", "Furniture", "Clothing", "Sports", "Other"];

function Marketplace() {
  const { currentUser } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(data);
    } catch (error) {
      toast.error("Failed to load items");
    }
    setLoading(false);
  }

  async function reserveItem(item) {
    try {
      const itemRef = doc(db, "items", item.id);
      await updateDoc(itemRef, {
        status: "reserved",
        reservedBy: currentUser.uid,
        reservedByName: currentUser.displayName || "IITD Student",
        reservedByEmail: currentUser.email,
      });

      // 1. Create ANONYMOUS notification for the seller
      await addDoc(collection(db, "notifications"), {
        recipientId: item.sellerId,
        type: "reservation_anonymous",
        itemId: item.id,
        itemTitle: item.title,
        itemPrice: item.price,
        // intentionally omitting buyerName and buyerEmail
        read: false,
        createdAt: serverTimestamp(),
      });

      // 2. Create DETAILED notification for the Admin Meditator
      await addDoc(collection(db, "notifications"), {
        recipientId: "ADMIN_GROUP",
        type: "reservation_admin",
        itemId: item.id,
        itemTitle: item.title,
        itemPrice: item.price,
        sellerName: item.sellerName || "Unknown Seller",
        sellerEmail: item.sellerEmail || "Unknown Email",
        buyerName: currentUser.displayName || "IITD Student",
        buyerEmail: currentUser.email,
        read: false,
        createdAt: serverTimestamp(),
      });

      toast.success("Item reserved successfully!");
      fetchItems();
    } catch (error) {
      toast.error("Failed to reserve item");
    }
  }

  const filteredItems = items.filter((item) => {
    if (currentUser && item.sellerId === currentUser.uid) {
      return false;
    }
    const matchesSearch =
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      item.category?.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>
          Explore the{" "}
          <span className="gradient-text">Marketplace</span>
        </h1>
        <p>Discover great deals from students in your community</p>
      </div>

      {/* Controls */}
      <div className="marketplace-controls">
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            id="marketplace-search"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <p className="items-count">
        {filteredItems.length} item{filteredItems.length !== 1 && "s"} found
      </p>

      {/* Loading Skeleton */}
      {loading && (
        <div className="loading-grid">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-image"></div>
              <div className="skeleton-body">
                <div className="skeleton-line w-60 h-lg"></div>
                <div className="skeleton-line w-40"></div>
                <div className="skeleton-line w-80"></div>
                <div className="skeleton-line h-btn"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredItems.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">
            <Package size={32} />
          </div>
          <h3>No items found</h3>
          <p>
            {searchQuery || activeCategory !== "All"
              ? "Try adjusting your search or filters."
              : "Be the first to list something!"}
          </p>
          <Link to="/post-item" className="btn btn-primary" style={{ display: "inline-flex" }}>
            <PlusCircle size={18} />
            Post an Item
          </Link>
        </div>
      )}

      {/* Grid */}
      {!loading && filteredItems.length > 0 && (
        <div className="marketplace-grid">
          {filteredItems.map((item) => (
            <div key={item.id} className="product-card" id={`product-${item.id}`}>
              <div className="product-card-image">
                {item.image ? (
                  <img src={item.image} alt={item.title} />
                ) : (
                  <div style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-muted)"
                  }}>
                    <Package size={48} />
                  </div>
                )}
                <span className={`product-card-badge ${item.status === "available" ? "badge-available" : "badge-reserved"}`}>
                  {item.status === "available" ? "Available" : "Reserved"}
                </span>
              </div>

              <div className="product-card-body">
                <h3>{item.title}</h3>
                <div className="price">₹{Math.round(item.price * 1.08)}</div>
                <p className="description">{item.description || "No description provided"}</p>

                {item.sellerId === currentUser?.uid ? (
                  <button className="buy-btn" disabled style={{ background: "var(--bg-darker)", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    <User size={16} />
                    Your Listing
                  </button>
                ) : item.status === "available" ? (
                  <button
                    className="buy-btn buy-btn-active"
                    onClick={() => reserveItem(item)}
                  >
                    <ShoppingCart size={16} />
                    Reserve Now
                  </button>
                ) : (
                  <button className="buy-btn buy-btn-reserved" disabled>
                    <CheckCircle size={16} />
                    Reserved
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

export default Marketplace;