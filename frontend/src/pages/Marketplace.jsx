import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Search, Package, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CATEGORIES = ["All", "Electronics", "Books", "Furniture", "Clothing", "Sports", "Other"];

function Marketplace() {
  const { currentUser, userData, isBlocked } = useAuth();
  const navigate = useNavigate(); // we need to import useNavigate and use it to redirect
  const location = useLocation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(location.state?.category || "All");

  useEffect(() => {
    if (location.state?.category) {
      setActiveCategory(location.state.category);
    }
  }, [location.state]);

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

  const statusOrder = { available: 0, reserved: 1, sold: 2 };

  const filteredItems = items
    .filter((item) => {
      if (item.sellerBlocked) return false;

      const matchesSearch =
        item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        item.category?.toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => (statusOrder[a.status] ?? 0) - (statusOrder[b.status] ?? 0));

  return (
    <div className="marketplace">
      <div className="marketplace-header">
        <h1>
          Explore the{" "}
          <span className="gradient-text">Marketplace</span>
        </h1>
        <p>Discover great deals from students in your community</p>
      </div>

      {isBlocked && (
        <div style={{
          backgroundColor: "rgba(248, 113, 113, 0.15)",
          border: "1px solid var(--danger)",
          color: "var(--danger)",
          padding: "var(--space-md)",
          borderRadius: "var(--radius-md)",
          marginBottom: "var(--space-xl)",
          fontWeight: "600",
          textAlign: "center"
        }}>
          You have been blocked from using the PeerMart services. Contact the admin for more information.
        </div>
      )}

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
        {filteredItems.filter(i => i.status !== "sold").length} item{filteredItems.filter(i => i.status !== "sold").length !== 1 && "s"} available
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
          {filteredItems.map((item) => {
            const isSold = item.status === "sold";
            return (
              <div
                key={item.id}
                className={`product-card${isSold ? " product-card-sold" : ""}`}
                id={`product-${item.id}`}
                onClick={() => navigate(`/item/${item.id}`)}
                style={{ cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s" }}
              >
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
                  <span className={`product-card-badge ${isSold ? "badge-sold" : item.status === "available" ? "badge-available" : "badge-reserved"}`}>
                    {isSold ? "Sold" : item.status === "available" ? "Available" : "Reserved"}
                  </span>
                </div>

                <div className="product-card-body">
                  <h3>{item.title}</h3>
                  <div className="price">₹{item.price}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Marketplace;