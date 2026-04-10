import React from 'react';
import { ShieldAlert, MapPin, Eye, Lock, ChevronRight, UserX, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const tips = [
  {
    title: "Meet in Busy, Public Campus Locations",
    icon: <MapPin size={22} color="var(--accent-primary)" />,
    desc: "Always arrange to meet in well-lit, high-traffic areas on campus — such as the library forecourt, the Student Activity Centre, or a cafeteria during peak hours. Avoid secluded spots, late-night meetups, or private rooms with someone you don't already know."
  },
  {
    title: "Inspect Items Thoroughly Before Paying",
    icon: <Eye size={22} color="var(--accent-primary)" />,
    desc: "Examine the item carefully before handing over any money or agreeing to complete the transaction. For electronics, ask the seller to power it on and demonstrate its full functionality. You are not obligated to proceed if the item does not match the listing — in that case, you may be eligible for a refund of the reservation fee."
  },
  {
    title: "Only Use the Platform's Contact Channels",
    icon: <Phone size={22} color="var(--accent-primary)" />,
    desc: "Use the phone number and email shared in 'My Reservations' to coordinate with the seller. Do not make any additional payments outside of PeerMart. The only fee charged by the platform is the 3% reservation fee at the time of booking. Be wary of any request for UPI transfers, gift cards, or cash before the meeting."
  },
  {
    title: "Protect Your Account Credentials",
    icon: <Lock size={22} color="var(--accent-primary)" />,
    desc: "Never share your IITD password, OTP, or any banking credentials with anyone — including people claiming to be from PeerMart. The platform will never ask for this information via any communication channel. Enable two-factor authentication on your institutional account for additional security."
  },
  {
    title: "Know What to Do If a Seller Is Unresponsive",
    icon: <UserX size={22} color="var(--accent-primary)" />,
    desc: "If a seller does not respond within a reasonable time after you have reserved their item, use the 'Unreserve' option in 'My Reservations' to free your slot, and then use 'Raise an Issue' in your Profile to report the situation and request a refund. An unresponsive seller is a valid ground for a full reservation fee refund."
  },
  {
    title: "Report Suspicious Listings or Behaviour",
    icon: <ShieldAlert size={22} color="var(--danger)" />,
    desc: "If a listing seems fraudulent, a price seems implausibly low, or a seller behaves suspiciously, trust your instincts. Use the 'Report Item' button on the listing page to flag it for admin review. For more serious concerns or personal disputes, use 'Raise an Issue' in your Profile to communicate directly with the PeerMart team."
  }
];

function SafetyTips() {
  return (
    <div className="marketplace" style={{ maxWidth: '860px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1><span className="gradient-text">Safety Tips</span></h1>
        <p>Follow these guidelines to ensure every transaction on PeerMart is safe, smooth, and hassle-free.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {tips.map((tip, idx) => (
          <div key={idx} style={{ background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: 'var(--space-lg) var(--space-xl)', background: 'var(--bg-darker)', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ flexShrink: 0 }}>{tip.icon}</span>
              <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{tip.title}</h3>
            </div>
            <div style={{ padding: 'var(--space-lg) var(--space-xl)' }}>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0, fontSize: '14px' }}>{tip.desc}</p>
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

export default SafetyTips;
