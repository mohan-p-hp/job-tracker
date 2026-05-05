import React, { useEffect, useState } from 'react'
import { markReply } from '../api/jobs'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function FollowUps() {
  const [followUps, setFollowUps] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchFollowUps = async () => {
    setLoading(true)
    try {
      const res = await axios.get('/outreach/pending')
      setFollowUps(Array.isArray(res.data) ? res.data : [])
    } catch {
      setFollowUps([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFollowUps() }, [])

  const handleMarkReplied = async (id) => {
    try {
      await markReply(id)
      toast.success('Marked as replied!')
      fetchFollowUps()
    } catch {
      toast.error('Failed to update')
    }
  }

  const daysBadge = (days) => {
    if (days >= 14) return { bg: '#FCEBEB', color: '#A32D2D' }
    if (days >= 7)  return { bg: '#FAEEDA', color: '#854F0B' }
    return { bg: '#E6F1FB', color: '#185FA5' }
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '500', margin: 0, color: 'var(--text)' }}>Follow-up reminders</h2>
        <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          {followUps.length} pending {followUps.length === 1 ? 'follow-up' : 'follow-ups'}
        </span>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>Loading...</p>
      ) : followUps.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '60px' }}>
          <p style={{ fontSize: '15px', marginBottom: '8px' }}>All caught up!</p>
          <p style={{ fontSize: '13px' }}>No follow-ups pending. Check back after sending outreach emails.</p>
        </div>
      ) : (
        followUps.map(f => {
          const badge = daysBadge(f.days_ago)
          return (
            <div key={f.id} style={{
              background: 'var(--bg-card)',
              border: '0.5px solid var(--border)',
              borderRadius: '10px', padding: '16px 20px', marginBottom: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: '12px',
            }}>
              <div>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--text)' }}>{f.company_name}</p>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>{f.job_title}</p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                  Sent to: {f.recruiter_name || f.recruiter_email || 'Unknown'} · {f.subject}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '20px', background: badge.bg, color: badge.color, fontWeight: '500' }}>
                  {f.days_ago} days ago
                </span>
                <button onClick={() => handleMarkReplied(f.id)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: 'none',
                  background: '#EAF3DE', color: '#3B6D11', fontSize: '12px',
                  fontWeight: '500', cursor: 'pointer',
                }}>
                  Mark replied
                </button>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
