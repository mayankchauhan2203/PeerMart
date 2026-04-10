import React from 'react';
import { HelpCircle, ChevronRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

function HelpCenter() {
  const faqs = [
    {
      q: "How do I reserve an item?",
      a: "Navigate to the marketplace, click on the item you want, and click 'Reserve Now'. You'll need to provide a 10-digit phone number and type 'reserve' to confirm. A small platform fee (3% of item price, max ₹30) is charged via Razorpay to lock in the reservation."
    },
    {
      q: "What happens after I reserve an item?",
      a: "Once payment is confirmed, the seller is immediately notified with your contact details. Go to 'My Reservations' in your profile to see the seller's contact information and coordinate a meetup on campus to inspect and collect the item."
    },
    {
      q: "How does the 3% reservation fee work?",
      a: "When you reserve an item, a platform fee of 3% of the item price is charged — capped at a maximum of ₹30 for expensive items. This fee is processed securely through Razorpay. It is non-refundable and covers the cost of running PeerMart."
    },
    {
      q: "How do I use My Reservations?",
      a: "Go to your Profile and click 'My Reservations'. You can see all your active reservations, view the seller's contact details (phone and email), and cancel a reservation if needed."
    },
    {
      q: "What is 'Raise an Issue'?",
      a: "Found in your Profile under Account Settings, 'Raise an Issue' lets you send a message directly to the PeerMart administrators with a subject and description. Admins can mark your issue as resolved once it is addressed."
    },
    {
      q: "Why was my account blocked?",
      a: "Accounts are blocked if we detect abusive behavior, fraudulent listings, or repeated no-shows after reserving items. If you believe this is a mistake, use the 'Raise an Issue' option in your profile to contact the admins."
    },
    {
      q: "Are items shipped?",
      a: "No. PeerMart is a hyper-local campus marketplace. All transactions and item handoffs happen in person on campus."
    },
    {
      q: "What should I do if an item is not as described?",
      a: "Inspect the item thoroughly before completing the sale. If it doesn't match the description, you can refuse the transaction. Please use the 'Report Item' button on the item page to inform the administration team."
    }
  ];

  return (
    <div className="marketplace" style={{ maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Help Center</span>
        </h1>
        <p>Frequently asked questions about buying and selling on PeerMart.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {faqs.map((faq, idx) => (
          <div key={idx} className="admin-report-card">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', marginBottom: '8px', marginTop: 0 }}>
              <HelpCircle size={20} color="var(--accent-primary)" />
              {faq.q}
            </h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5, marginLeft: '28px', marginTop: 0, marginBottom: 0 }}>
              {faq.a}
            </p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
        <MessageSquare size={28} color="var(--accent-primary)" style={{ marginBottom: '12px' }} />
        <h3 style={{ marginTop: 0, marginBottom: '8px' }}>Still need help?</h3>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Use the "Raise an Issue" option in your profile to contact the admins directly.</p>
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
