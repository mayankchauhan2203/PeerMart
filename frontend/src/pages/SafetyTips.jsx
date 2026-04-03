import React from 'react';
import { ShieldAlert, MapPin, Eye, Lock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

function SafetyTips() {
  const tips = [
    {
      title: "Meet in Public Spaces",
      icon: <MapPin size={24} color="var(--accent-primary)" />,
      desc: "Always arrange to meet the other party in well-lit, public areas on campus, such as the library, student union, or cafeterias. Avoid secluded spots or meeting in private dorm rooms unless absolutely necessary and accompanied."
    },
    {
      title: "Inspect Items Thoroughly",
      icon: <Eye size={24} color="var(--accent-primary)" />,
      desc: "Take your time to thoroughly inspect the item before handing over any money to the admin. If you are buying electronics, ask the admin to demonstrate that it works. You are not obligated to complete the transaction if the item doesn't match its description."
    },
    {
      title: "Keep Communications on Platform",
      icon: <Lock size={24} color="var(--accent-primary)" />,
      desc: "Wait for the admin to facilitate the transaction after reserving. Be wary of users trying to circumvent the process or asking for payment before you meet in person."
    },
    {
      title: "Report Suspicious Behavior",
      icon: <ShieldAlert size={24} color="var(--danger)" />,
      desc: "If something feels off, trust your instincts. Use the 'Report Item' button or contact administrators if a seller acts suspiciously or if a listing seems fraudulent."
    }
  ];

  return (
    <div className="marketplace" style={{ maxWidth: '800px', margin: '0 auto', minHeight: 'calc(100vh - 80px)' }}>
      <div className="marketplace-header" style={{ textAlign: "left", marginBottom: "var(--space-xl)" }}>
        <h1>
          <span className="gradient-text">Safety Tips</span>
        </h1>
        <p>Guidelines to ensure secure and trouble-free campus transactions.</p>
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
