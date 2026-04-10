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
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>1. Platform Liability Disclaimer</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          PeerMart is a peer-to-peer connection board designed to facilitate transactions within the campus community. When an item is reserved, contact details are shared directly between the buyer and seller. PeerMart acts solely as a discovery platform and assumes no liability for the quality, safety, legality, or descriptions of items listed by users. All physical transactions happen independently of the platform.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>2. User Eligibility</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Access to PeerMart is restricted to verified IITD students. You must register using your IITD institutional login. You are responsible for maintaining the confidentiality of your account credentials and all activity associated with your account.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>3. Appropriate Conduct</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Users agree not to list illegal items, counterfeit goods, hazardous materials, or explicit content. Malicious behaviour — including repeatedly reserving items without showing up (flaking) or submitting false reports — will result in account restriction. To prevent spamming, there is a limit of 2 listings and 2 reservations per day per user.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>4. Reservation Fees</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-xl)' }}>
          Reserving an item requires a platform fee of <strong>3% of the item price</strong>, capped at a maximum of <strong>₹30</strong> for items priced above ₹1,000. This fee is processed securely through Razorpay and covers the operational cost of running PeerMart. This fee is refundable only in case the seller doesn't respond; the seller doesn't have the item or the item was damaged; or any other reason that is not the fault of the buyer. Listing items on PeerMart is completely free.
        </p>

        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>5. Account Termination</h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 0 }}>
          Administrators reserve the right to suspend or terminate accounts, block users, or remove listings at any time, with or without prior notice, if these terms are violated. You may voluntarily delete your account under Account Settings in your Profile.
        </p>
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center' }}>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex' }}>
          Back to Home <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default TermsOfService;
