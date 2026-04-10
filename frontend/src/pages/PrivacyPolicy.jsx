import React from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function PrivacyPolicy() {
  return (
    <div className="marketplace" style={{ maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Privacy Policy</span>
        </h1>
        <p>How we handle and protect your institutional data on PeerMart.</p>
      </div>

      <div style={{ padding: 'var(--space-2xl)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>1. Data We Collect</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          PeerMart collects the minimum data required to operate the campus marketplace securely. This includes your IITD institutional email, display name, entry number, department, hostel, and an optional phone number used when reserving items. We also store data related to your listings, reservations, and completed transaction history.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>2. Peer-to-Peer Contact Sharing</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          When a buyer successfully pays the reservation fee and reserves your item, their name, email address, and phone number are made available to you (the seller) in your "My Listings" tab. Symmetrically, as a buyer, you gain access to the seller's contact details via your "My Reservations" tab. This contact sharing happens directly between the two parties involved — no intermediary holds or routes this information.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>3. Admin Visibility</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Platform administrators have read access to user profiles, listings, reservations, and completed orders for the purpose of resolving disputes, enforcing policies, and monitoring platform health. Feedback messages submitted via the "Give Feedback" page and issue reports submitted via "Raise an Issue" in your profile are visible only to administrators.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>4. No Third-Party Sharing</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          We strictly do <strong>not</strong> sell, rent, or trade your personal information with any third parties. Payment processing is handled by Razorpay; only the reservation fee amount is transmitted — no card details or banking credentials are stored on PeerMart servers.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>5. Data Deletion</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
          You can delete your account at any time from the "Account Settings" section of your Profile. Deleting your account removes your profile, all active listings, and any active reservations from our systems. Completed order records may be retained for a short period per institutional data retention guidelines.
        </p>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
        <Link to="/" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
          Back to Home <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default PrivacyPolicy;
