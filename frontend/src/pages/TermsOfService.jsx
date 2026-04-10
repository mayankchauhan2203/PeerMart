import React from 'react';
import { FileText, ChevronRight, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';

const sections = [
  {
    title: "1. Platform Overview & Liability",
    body: "PeerMart is a peer-to-peer marketplace designed exclusively for the IITD campus community. It connects buyers and sellers directly — once a reservation is made, contact information is shared between the two parties so they can coordinate the exchange in person. PeerMart does not mediate, hold, or facilitate the physical exchange of goods. The platform assumes no liability for the quality, accuracy, legality, or safety of items listed. All in-person transactions are the sole responsibility of the users involved."
  },
  {
    title: "2. User Eligibility",
    body: "Access to PeerMart is restricted to verified students of IIT Delhi. Registration is done exclusively through the IITD institutional login (OAuth). By using this platform, you confirm that you are a current IITD student and that you are responsible for all activity associated with your account."
  },
  {
    title: "3. Listings & Conduct",
    body: "Users may not list illegal items, counterfeit goods, hazardous materials, weapons, or any content that violates campus policy or applicable law. Each user is limited to 2 new listings and 2 new reservations per 24-hour period to maintain platform quality. Repeated no-shows after reserving, submission of false reports, or any other form of abuse will result in account restrictions or permanent bans at the discretion of the administrators."
  },
  {
    title: "4. Reservation Fee & Refund Policy",
    body: null,
    custom: true
  },
  {
    title: "5. Account Suspension & Termination",
    body: "Platform administrators reserve the right to suspend, block, or permanently delete any account at any time if these Terms are violated, without prior notice. You may also voluntarily delete your account at any time from the Account Settings section of your Profile, which will remove your listings and active reservations."
  }
];

function TermsOfService() {
  return (
    <div className="marketplace" style={{ maxWidth: '860px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1><span className="gradient-text">Terms of Service</span></h1>
        <p>These terms govern your use of PeerMart. Please read them carefully before proceeding.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {sections.map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'var(--space-lg) var(--space-xl)', background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-subtle)' }}>
              <FileText size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.1px' }}>{s.title}</h2>
            </div>
            <div style={{ padding: 'var(--space-xl)' }}>
              {s.custom ? (
                <>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-md)', marginTop: 0 }}>
                    A platform fee of <strong style={{ color: 'var(--text-primary)' }}>3% of the item price</strong> (maximum <strong style={{ color: 'var(--text-primary)' }}>₹30</strong>) is charged at the time of reservation, processed securely through Razorpay. Listing items on PeerMart is entirely free of charge.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div style={{ background: 'rgba(74,222,128,0.05)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '13px', color: '#4ade80' }}>✓ Eligible for Refund</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        The seller is unresponsive after the reservation is confirmed; the item is not available or significantly differs from the listing; the item is damaged or misrepresented by the seller; or any other situation where the transaction fails due to no fault of the buyer.
                      </p>
                    </div>
                    <div style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                      <p style={{ margin: '0 0 6px 0', fontWeight: 700, fontSize: '13px', color: 'var(--danger)' }}>✗ Not Eligible for Refund</p>
                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                        The buyer does not show up to meet the seller; the buyer changes their mind after reserving; the buyer cancels after the seller has already arranged a meeting; or any other situation where the transaction fails due to the buyer's actions.
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', background: 'rgba(244,163,0,0.05)', border: '1px solid rgba(244,163,0,0.2)', borderRadius: 'var(--radius-md)', padding: 'var(--space-md)' }}>
                    <AlertTriangle size={15} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      To request a refund, the buyer must use the <strong>"Raise an Issue"</strong> feature in their Profile page and provide details of the situation. Refund decisions are made solely at the discretion of the PeerMart administrators after reviewing the case.
                    </p>
                  </div>
                </>
              ) : (
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              )}
            </div>
          </div>
        ))}
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
