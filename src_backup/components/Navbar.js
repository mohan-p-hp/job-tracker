import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const location = useLocation();

  const linkStyle = (path) => ({
    textDecoration: 'none',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: location.pathname === path ? '#185FA5' : '#5F5E5A',
    background: location.pathname === path ? '#E6F1FB' : 'transparent',
  });

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      height: '56px',
      borderBottom: '0.5px solid #e0e0e0',
      background: '#fff',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <span style={{ fontWeight: '600', fontSize: '16px', color: '#1a1a1a' }}>
        JobTracker
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        <Link to="/" style={linkStyle('/')}>Dashboard</Link>
        <Link to="/analytics" style={linkStyle('/analytics')}>Analytics</Link>
      </div>
    </nav>
  );
}
