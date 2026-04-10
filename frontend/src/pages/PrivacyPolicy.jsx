import React from 'react';
import { Lock, ChevronRight, Shield, Users, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    icon: <Users size={18} color="var(--accent-primary)" />,
    title: "Information We Collect",
    body: "PeerMart collects only the minimum data necessary to operate the marketplace. Through your IITD institutional login, we receive your full name, institutional email address, entry number, department, year of study, and hostel. You may additionally provide a phone number, which is required when placing a reservation. We also store data related to your listings, reservation history, and completed transactions."
  },
  {
    icon: <Shield size={18} color="var(--accent-primary)" />,
    title: "How Your Information Is Used",
    body: "Your information is used solely to facilitate peer-to-peer transactions on campus. When you successfully reserve an item, your name, email, and phone number are shared with the seller to allow direct coordination. Symmetrically, as a buyer, you receive the seller's contact details after a confirmed reservation. No user's data is used for advertising, marketing, or profiling purposes."
  },
  {
    icon: <Lock size={18} color="var(--accent-primary)" />,
    title: "Peer-to-Peer Contact Sharing",
    body: "Contact details are shared directly and exclusively between the two parties involved in a transaction — the buyer and the seller. No third party, including PeerMart itself, acts as an intermediary holder of this information. The shared data is visible only within the platform (via 'My Listings' for sellers and 'My Reservations' for buyers)."
  },
  {
    icon: <Shield size={18} color="var(--accent-primary)" />,
    title: "Admin & Platform Visibility",
    body: "Platform administrators have read access to user profiles, listings, reservations, and completed orders for the purpose of resolving disputes, enforcing the Terms of Service, and monitoring platform health. Messages sent via 'Raise an Issue' and general feedback submitted through the Feedback page are visible exclusively to administrators and are kept confidential."
  },
  {
    icon: <Lock size={18} color="var(--accent-primary)" />,
    title: "Third-Party Services",
    body: "Payment processing is handled by Razorpay, a PCI-DSS compliant payment gateway. PeerMart does not store any card details or sensitive banking credentials. Only the reservation fee amount and a reference order ID are transmitted to Razorpay. We do not sell, rent, share, or trade your personal information with any other third party."
  },
  {
    icon: <RefreshCw size={18} color="var(--accent-primary)" />,
    title: "Data Retention & Deletion",
    body: "You may delete your PeerMart account at any time from the Account Settings section of your Profile. Deleting your account will remove your personal profile, all active listings, and any active reservations. Completed transaction records may be retained for a limited period as required by institutional data governance policies. To request manual data removal, use the 'Raise an Issue' feature in your profile."
  }
];

function PrivacyPolicy() {
  return (
    <div className="marketplace" style={{ maxWidth: '860px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1><span className="gradient-text">Privacy Policy</span></h1>
        <p>We are committed to being transparent about how your data is collected, used, and protected on PeerMart.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {sections.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'var(--space-lg) var(--space-xl)', background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-subtle)' }}>
              {s.icon}
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</h2>
            </div>
            <div style={{ padding: 'var(--space-xl)' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
            </div>
          </div>
        ))}
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
