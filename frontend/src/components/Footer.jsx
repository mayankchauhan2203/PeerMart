import { Link } from "react-router-dom";
import { Github, Twitter, Instagram } from "lucide-react";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-brand">
          <h3>
            <span className="gradient-text">PeerMart</span>
          </h3>
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
            <li><Link to="/marketplace">Electronics</Link></li>
            <li><Link to="/marketplace">Books</Link></li>
            <li><Link to="/marketplace">Furniture</Link></li>
            <li><Link to="/marketplace">Clothing</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <ul>
            <li><a href="#help">Help Center</a></li>
            <li><a href="#safety">Safety Tips</a></li>
            <li><a href="#terms">Terms of Service</a></li>
            <li><a href="#privacy">Privacy Policy</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} PeerMart. Built for students, by students.</p>
        <div className="footer-social">
          <a href="#github" aria-label="GitHub">
            <Github size={16} />
          </a>
          <a href="#twitter" aria-label="Twitter">
            <Twitter size={16} />
          </a>
          <a href="#instagram" aria-label="Instagram">
            <Instagram size={16} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
