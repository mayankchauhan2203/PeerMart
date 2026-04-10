import React from 'react';
import { ShieldAlert, MapPin, Eye, Lock, ChevronRight, UserX, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

function SafetyTips() {
  const tips = [
    {
      title: "Meet in Public Campus Spaces",
      icon: <MapPin size={24} color="var(--accent-primary)" />,
      desc: "Always arrange to meet in well-lit, busy public areas on campus — such as the library, student centre, or cafeterias. Never meet in private rooms alone, and let a friend know where you're going."
    },
    {
      title: "Inspect Items Before Completing the Sale",
      icon: <Eye size={24} color="var(--accent-primary)" />,
      desc: "Take your time to thoroughly inspect the item before handing over any money to the seller. For electronics, ask the seller to demonstrate that it works. You are not obligated to complete the transaction if the item doesn't match the listing description."
    },
    {
      title: "Communicate Through Official Channels",
      icon: <Phone size={24} color="var(--accent-primary)" />,
      desc: "Use the phone number and email shared in 'My Reservations' to coordinate with the seller. Be cautious of anyone asking for online payments, gift cards, or UPI transfers before you physically meet — the only platform fee is the 3% reservation fee paid upfront on PeerMart."
    },
    {
      title: "Protect Your Personal Information",
      icon: <Lock size={24} color="var(--accent-primary)" />,
      desc: "Your contact details are only visible to the specific user you are reserving from. Do not share your passwords, OTPs, or banking details with anyone over chat, regardless of who they claim to be."
    },
    {
      title: "Know What to Do If a Seller Is Unresponsive",
      icon: <UserX size={24} color="var(--accent-primary)" />,
      desc: "If a seller does not respond after reservation, use the 'Unreserve' button in your 'My Reservations' tab to cancel and free up your reservation slot. You can then raise an issue to the admins via your profile if you suspect foul play."
    },
    {
      title: "Report Suspicious Behaviour",
      icon: <ShieldAlert size={24} color="var(--danger)" />,
      desc: "If something feels off, trust your instincts. Use the 'Report Item' button on the item page to flag suspicious listings. For broader concerns, use the 'Raise an Issue' feature in your profile to contact the PeerMart administration team."
    }
  ];

  return (
    <div className="marketplace" style={{ maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Safety Tips</span>
        </h1>
        <p>Guidelines to ensure secure and trouble-free campus transactions on PeerMart.</p>
      </div>

      <div style={{ display: 'grid', gap: 'var(--space-lg)' }}>
        {tips.map((tip, idx) => (
          <div key={idx} className="feature-card" style={{ textAlign: 'left', display: 'flex', gap: 'var(--space-md)' }}>
            <div style={{ flexShrink: 0, padding: '12px', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', height: 'fit-content' }}>
              {tip.icon}
            </div>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '8px', color: 'var(--text-primary)' }}>{tip.title}</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0, lineHeight: 1.6 }}>{tip.desc}</p>
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
