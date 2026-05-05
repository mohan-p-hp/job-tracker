import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.body.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [dark])

  const linkStyle = (path) => ({
    textDecoration: 'none',
    padding: '7px 14px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: location.pathname === path ? '#185FA5' : 'var(--text-secondary)',
    background: location.pathname === path ? 'var(--badge-applied-bg)' : 'transparent',
    transition: 'background .15s, color .15s',
  })

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 16px', height: '56px',
      borderBottom: '0.5px solid var(--nav-border)',
      background: 'var(--nav-bg)',
      position: 'sticky', top: 0, zIndex: 100,
    }}>
      <span className="nav-brand" style={{ fontWeight: '600', fontSize: '16px', color: 'var(--text)' }}>
        JobTracker
      </span>

      <div className="nav-links" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <Link to="/" style={linkStyle('/')}>Dashboard</Link>
        <Link to="/analytics" style={linkStyle('/analytics')}>Analytics</Link>
        <Link to="/followups" style={linkStyle('/followups')}>Follow-ups</Link>
      </div>

      <button
        className="dark-toggle"
        onClick={() => setDark(d => !d)}
        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        style={{
          background: 'var(--bg-input)',
          border: '0.5px solid var(--border-input)',
          borderRadius: '8px',
          padding: '6px 12px',
          cursor: 'pointer',
          fontSize: '13px',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          transition: 'background .15s',
        }}
      >
        <span style={{ fontSize: '15px' }}>{dark ? '☀' : '☾'}</span>
        {dark ? 'Light' : 'Dark'}
      </button>
    </nav>
  )
}
