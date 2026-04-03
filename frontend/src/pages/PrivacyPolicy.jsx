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
        <p>How we handle and protect your institutional data.</p>
      </div>

      <div style={{ padding: 'var(--space-2xl)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>1. Data Collection</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          PeerMart collects the minimum amount of data required to run the campus marketplace securely. This includes your institutional email address (e.g., student@iitd.ac.in), your display name, and an optional phone number necessary for reserving items. We also aggregate data related to your item listings and transaction history.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>2. Use of Information</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          The phone number you provide when reserving an item is exclusively shared with the administrators to facilitate contact between the buyer and the seller. Your email and identity are kept within the private campus database. We do not use your information for targeted advertising or outside marketing.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>3. Information Sharing</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          We strictly do <strong>not</strong> sell, rent, or trade your personal information with third parties. Data is only accessible to system administrators to resolve reports and oversee the mediation of reserved items.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>4. Data Deletion</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
          If you wish to terminate your account and remove your listings and personal data from our systems, please contact the network administrators. Retained data strictly follows institutional retention guidelines.
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
