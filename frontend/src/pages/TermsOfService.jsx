import React from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function TermsOfService() {
  return (
    <div className="marketplace" style={{ maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Terms of Service</span>
        </h1>
        <p>Please read these terms carefully before using PeerMart.</p>
      </div>

      <div style={{ padding: 'var(--space-2xl)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={24} color="var(--accent-primary)" />
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>1. Administrator Liability Disclaimer</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          PeerMart facilitates transactions within the campus community by acting as a direct intermediary. When an item is reserved, our administrators will first purchase the item from the seller and subsequently deliver and sell it to the buyer. While administrators oversee this exchange, PeerMart assumes no liability for the initial quality, safety, legality, or descriptions of items listed by original sellers.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>2. User Eligibility</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Access to PeerMart is restricted to verified students. You must register using a valid institutional email address. You are responsible for maintaining the confidentiality of your account credentials.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>3. Appropriate Conduct</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Users agree not to list illegal items, counterfeit goods, hazardous materials, or explicit content. Malicious behavior, including repeatedly reserving items without showing up (flaking) or submitting false reports, will result in account restriction.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>4. Account Termination</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
          Administrators reserve the right to suspend or terminate accounts, block users, or remove listings at any time, with or without prior notice, if these terms are violated.
        </p>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Accept & Continue <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default TermsOfService;
