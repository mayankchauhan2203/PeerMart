import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function HelpCenter() {
  const faqs = [
    {
      q: "How do I reserve an item?",
      a: "Navigate to the marketplace, click on the item you're interested in, and click 'Reserve Now'. You will need to provide your phone number and type 'reserve' to lock in the item. The item will be hidden from other buyers until the reservation is complete."
    },
    {
      q: "How do I receive my item after reserving?",
      a: "Once you reserve an item, our admins are notified. We act as intermediaries by first purchasing the item from the seller, and then we will personally contact you to deliver the item and complete the transaction."
    },
    {
      q: "Why was my account blocked?",
      a: "Accounts are typically blocked if we detect abusive behavior, fraudulent listings, or repeated no-shows after reserving items. If you believe this is a mistake, please reach out to the campus administrators."
    },
    {
      q: "Are the items shipped?",
      a: "No. PeerMart is a hyper-local campus marketplace. All transactions and item handoffs happen locally on campus in person."
    },
    {
      q: "What should I do if an item is not as described?",
      a: "You must inspect the item thoroughly when meeting the seller. If it doesn't match the description, you have the right to refuse the transaction. Please use the 'Report Item' button on the item page to inform our administration team."
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

      <div style={{ marginTop: 'var(--space-2xl)', textAlign: 'center', padding: 'var(--space-lg)', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)' }}>
        <h3 style={{ marginTop: 0 }}>Still need help?</h3>
        <p style={{ color: 'var(--text-secondary)' }}>Contact the campus administrators for further assistance.</p>
        <Link to="/" className="btn btn-primary" style={{ display: 'inline-flex', marginTop: 'var(--space-md)' }}>
          Back to Home <ChevronRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default HelpCenter;
