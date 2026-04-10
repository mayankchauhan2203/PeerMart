import React from 'react';
import { HelpCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
  {
    q: "How do I reserve an item?",
    a: "Navigate to the Marketplace, open the item you want, and click 'Reserve Now'. You will be asked to confirm your 10-digit phone number and type 'reserve' to prevent accidental reservations. A platform fee of 3% of the item price (max ₹30) is then charged via Razorpay to lock in the reservation."
  },
  {
    q: "What happens after I pay the reservation fee?",
    a: "Once payment is confirmed, the seller is immediately notified and provided with your contact details. Head to 'My Reservations' in your Profile to view the seller's contact information, then coordinate a campus meetup directly to inspect and collect the item."
  },
  {
    q: "How is the reservation fee calculated?",
    a: "The fee is 3% of the item's listed price, with a cap of ₹30 for items priced above ₹1,000. For example, a ₹500 item carries a ₹15 fee; a ₹2,000 item carries the maximum fee of ₹30. Listing items is always free."
  },
  {
    q: "Is the reservation fee refundable?",
    a: "The fee is refundable only if the transaction fails due to a reason on the seller's side — for example, the seller is unresponsive, the item is unavailable, or it is significantly different from the listing. If the buyer cancels, doesn't show up, or changes their mind, the fee is non-refundable. To request a refund, use 'Raise an Issue' in your Profile."
  },
  {
    q: "What is 'My Reservations'?",
    a: "Found in your Profile, 'My Reservations' shows all items you have currently reserved. From there you can view the seller's contact details (email and phone number) to arrange a meetup, or cancel the reservation if needed. Note: cancelling releases the item back to the market but does not guarantee a refund of the reservation fee."
  },
  {
    q: "What is 'Raise an Issue'?",
    a: "This is a direct communication channel to the PeerMart administrators, available in your Profile under Account Settings. You can submit a subject and a message describing any problem — for example, a refund request, a seller dispute, or a platform concern. Admins can mark the issue as resolved once addressed."
  },
  {
    q: "Why was my account blocked?",
    a: "Accounts may be blocked for repeated no-shows after reserving, fraudulent listings, false reports, or other violations of our Terms of Service. If you believe this is in error, use 'Raise an Issue' in your Profile to contact the admins."
  },
  {
    q: "Are transactions and deliveries handled by PeerMart?",
    a: "No. PeerMart is a hyper-local campus marketplace. All item exchanges occur in person between the buyer and seller on campus. PeerMart does not facilitate shipping, delivery, or physical mediation of any kind."
  },
  {
    q: "What should I do if an item is not as described?",
    a: "Inspect the item thoroughly at the point of exchange before completing the sale. You are not obligated to proceed if the item doesn't match the listing. Use the 'Report Item' button on the item's page to alert the admin team, and use 'Raise an Issue' in your Profile if you wish to request a refund."
  }
];

function HelpCenter() {
  return (
    <div className="marketplace" style={{ maxWidth: '860px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1><span className="gradient-text">Help Center</span></h1>
        <p>Answers to the most common questions about buying and selling on PeerMart.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'var(--space-lg) var(--space-xl)', background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-subtle)' }}>
              <HelpCircle size={16} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{faq.q}</h3>
            </div>
            <div style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: '14px' }}>{faq.a}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', padding: 'var(--space-2xl)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
        <MessageSquare size={28} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
        <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>Didn't find your answer?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)', fontSize: '14px' }}>
          Use <strong>"Raise an Issue"</strong> in your Profile to contact the PeerMart team directly, or submit general feedback below.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/profile" className="btn btn-primary" style={{ display: 'inline-flex' }}>
            Go to Profile <ChevronRight size={16} />
          </Link>
          <Link to="/feedback" className="btn btn-secondary" style={{ display: 'inline-flex' }}>
            Give Feedback
          </Link>
        </div>
      </div>
    </div>
  );
}

export default HelpCenter;
