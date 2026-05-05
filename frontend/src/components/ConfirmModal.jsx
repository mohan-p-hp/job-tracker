import React from 'react'

export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300,
    }}>
      <div style={{
        background: 'var(--bg-card)', borderRadius: '12px',
        padding: '28px', width: '380px', maxWidth: '90vw',
        border: '0.5px solid var(--border)',
      }}>
        {/* Icon */}
        <div style={{
          width: '44px', height: '44px', borderRadius: '50%',
          background: '#FCEBEB', display: 'flex', alignItems: 'center',
          justifyContent: 'center', marginBottom: '16px', fontSize: '20px',
        }}>
          ⚠
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '500', color: 'var(--text)' }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
              border: '0.5px solid var(--border-input)', background: 'var(--bg-input)',
              color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px', borderRadius: '8px', fontSize: '14px',
              border: 'none', background: '#A32D2D', color: '#fff',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: '500',
            }}
          >
            {confirmLabel || 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}
