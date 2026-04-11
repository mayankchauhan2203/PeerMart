import { Link } from "react-router-dom";
import { Github, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <img
            src="/logo.png"
            alt="PeerMart"
            style={{ height: '32px', width: 'auto', objectFit: 'contain', marginBottom: '12px' }}
          />
          <p>
            The trusted peer-to-peer marketplace for campus communities.
            Buy, sell, and trade with fellow students safely.
          </p>
        </div>

        <div className="footer-col">
          <h4>Navigate</h4>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/marketplace">Marketplace</Link></li>
            <li><Link to="/post-item">Sell Item</Link></li>
            <li><Link to="/profile">Profile</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Categories</h4>
          <ul>
            <li><Link to="/marketplace" state={{ category: "Electronics" }}>Electronics</Link></li>
            <li><Link to="/marketplace" state={{ category: "Books" }}>Books</Link></li>
            <li><Link to="/marketplace" state={{ category: "Furniture" }}>Furniture</Link></li>
            <li><Link to="/marketplace" state={{ category: "Clothing" }}>Clothing</Link></li>
            <li><Link to="/marketplace" state={{ category: "Sports" }}>Sports</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><Link to="/help">Help Center</Link></li>
            <li><Link to="/safety">Safety Tips</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
            <li><Link to="/feedback">Give Feedback</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PeerMart. Built for students, by students.</p>
        <div className="footer-social">
          <a href="mailto:peermartiitd@gmail.com" aria-label="Gmail">
            <Mail size={16} />
          </a>
          <a href="https://www.linkedin.com/in/mayank-chauhan-mc2203" aria-label="LinkedIn">
            <Linkedin size={16} />
          </a>
          <a href="https://www.instagram.com/myself_mayankchauhan" aria-label="Instagram">
            <Instagram size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
