import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ShoppingBag, Shield, Zap, Heart, ArrowRight, Star, Store, Package } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function Home() {
  const [recentItems, setRecentItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchRecentItems() {
      try {
        const itemsSnap = await getDocs(collection(db, "items"));
        const itemsList = [];
        itemsSnap.forEach(doc => {
          const data = doc.data();
          if (data.status === "available") {
             itemsList.push({ id: doc.id, ...data });
          }
        });
        
        itemsList.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA;
        });

        setRecentItems(itemsList.slice(0, 7));
      } catch (error) {
        console.error("Error fetching homepage recent items:", error);
      }
    }
    fetchRecentItems();
  }, []);

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

          <div className="hero-recent-items">
            {recentItems.length > 0 ? (
               recentItems.map(item => (
                 <div 
                   key={item.id} 
                   className="recent-item-card" 
                   onClick={() => navigate('/marketplace')}
                 >
                   <div className="recent-item-image">
                     {item.image ? (
                       <img src={item.image} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                     ) : (
                       <Package size={32} color="var(--text-muted)" />
                     )}
                   </div>
                   <div>
                     <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>{item.title}</h4>
                     <div className="gradient-text" style={{ fontSize: '16px', fontWeight: 'bold' }}>₹{Math.round(item.price * 1.08)}</div>
                   </div>
                 </div>
               ))
            ) : null}
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
            <h3>Minimal Commission Fee</h3>
            <p>
              Keep almost everything you earn with our incredibly low commission rates. Built by students, for students.
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