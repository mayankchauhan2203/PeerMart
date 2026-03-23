import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingBag, Shield, Zap, Heart, ArrowRight, Star, Store } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function Home() {
  const [stats, setStats] = useState({ activeListings: 0, itemsTraded: 0, users: 0, loaded: false });

  useEffect(() => {
    async function fetchStats() {
      try {
        let active = 0;
        let tradedValue = 0;
        
        const itemsSnap = await getDocs(collection(db, "items"));
        itemsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === "available") {
            active++;
          } else {
            tradedValue += (Number(data.price) || 0);
          }
        });

        const usersSnap = await getDocs(collection(db, "users"));
        const usersCount = usersSnap.size;

        setStats({
          activeListings: active,
          itemsTraded: tradedValue,
          users: usersCount,
          loaded: true
        });
      } catch (error) {
        console.error("Error fetching homepage stats:", error);
      }
    }
    fetchStats();
  }, []);

  const formatCurrency = (val) => {
    if (val === 0) return "₹0";
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L+`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}K+`;
    return `₹${val}`;
  };

  return (
    <div>
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-blob hero-blob-1"></div>
          <div className="hero-blob hero-blob-2"></div>
          <div className="hero-blob hero-blob-3"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <span className="dot"></span>
            Trusted by students across campus
          </div>

          <h1 className="hero-title">
            Buy &amp; Sell Within
            <br />
            <span className="gradient-text">Your Campus</span>
          </h1>

          <p className="hero-subtitle">
            The peer-to-peer marketplace built for students.
            Find great deals on textbooks, electronics, furniture, and more — all from people you trust.
          </p>

          <div className="hero-actions">
            <Link to="/marketplace" className="btn btn-primary">
              <Store size={18} />
              Browse Marketplace
              <ArrowRight size={16} />
            </Link>
            <Link to="/post-item" className="btn btn-secondary">
              <ShoppingBag size={18} />
              Start Selling
            </Link>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{stats.loaded ? stats.activeListings : "..."}</div>
              <div className="hero-stat-label">Active Listings</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{stats.loaded ? stats.users : "..."}</div>
              <div className="hero-stat-label">Happy Students</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">{stats.loaded ? formatCurrency(stats.itemsTraded) : "..."}</div>
              <div className="hero-stat-label">Items Traded</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header">
          <span className="section-tag">Why PeerMart?</span>
          <h2 className="section-title">
            Everything you need,{" "}
            <span className="gradient-text">nothing you don't</span>
          </h2>
          <p className="section-subtitle">
            We built PeerMart to make campus trading simple, safe, and seamless.
          </p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">
              <Shield size={24} />
            </div>
            <h3>Campus Verified</h3>
            <p>
              Only verified students can list and buy items. Trade with confidence knowing everyone is part of your community.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={24} />
            </div>
            <h3>Instant Listings</h3>
            <p>
              Post an item in under 30 seconds. Add photos, set your price, and reach hundreds of potential buyers instantly.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Heart size={24} />
            </div>
            <h3>Zero Fees</h3>
            <p>
              No commissions, no hidden charges. Every rupee goes directly to you. Built by students, for students.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="cta-card">
          <Star size={32} className="gradient-text" style={{ marginBottom: "16px" }} />
          <h2>
            Ready to <span className="gradient-text">get started?</span>
          </h2>
          <p>Join thousands of students already trading on PeerMart.</p>
          <Link to="/post-item" className="btn btn-primary">
            <ShoppingBag size={18} />
            List Your First Item
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Home;