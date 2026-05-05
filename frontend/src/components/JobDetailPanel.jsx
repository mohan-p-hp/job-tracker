import React, { useEffect, useState } from 'react'
import { getOutreachLogs, markReply } from '../api/jobs'
import { updateJob } from '../api/jobs'
import toast from 'react-hot-toast'
import axios from 'axios'

const statusColors = {
  Applied:      { bg: '#E6F1FB', color: '#185FA5' },
  Interviewing: { bg: '#FAEEDA', color: '#854F0B' },
  Offer:        { bg: '#EAF3DE', color: '#3B6D11' },
  Rejected:     { bg: '#FCEBEB', color: '#A32D2D' },
  Ghosted:      { bg: '#F1EFE8', color: '#5F5E5A' },
}

const statusOrder = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted']

export default function JobDetailPanel({ job, onClose, onRefresh }) {
  const [logs, setLogs] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [notes, setNotes] = useState(job.notes || '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchLogs()
    fetchRecruiters()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await getOutreachLogs(job.id)
      setLogs(Array.isArray(res.data) ? res.data : [])
    } catch { setLogs([]) }
  }

  const fetchRecruiters = async () => {
    try {
      const res = await axios.get(`/recruiters?application_id=${job.id}`)
      setRecruiters(Array.isArray(res.data) ? res.data : [])
    } catch { setRecruiters([]) }
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    try {
      await updateJob(job.id, {
        company_name: job.company_name,
        job_title: job.job_title,
        job_url: job.job_url,
        platform: job.platform,
        status: job.status,
        applied_at: job.applied_at
          ? new Date(job.applied_at).toISOString().split('T')[0]
          : '',
        notes,
      })
      toast.success('Notes saved')
      onRefresh()
    } catch {
      toast.error('Failed to save notes')
    } finally {
      setSavingNotes(false)
    }
  }

  const handleMarkReply = async (id) => {
    try {
      await markReply(id)
      toast.success('Marked as replied')
      fetchLogs()
    } catch {
      toast.error('Failed to update')
    }
  }

  const badge = statusColors[job.status] || statusColors['Applied']
  const tabStyle = (tab) => ({
    padding: '7px 16px', fontSize: '13px', cursor: 'pointer',
    border: 'none', background: 'none', fontFamily: 'inherit',
    borderBottom: `2px solid ${activeTab === tab ? '#185FA5' : 'transparent'}`,
    color: activeTab === tab ? '#185FA5' : '#888',
    fontWeight: activeTab === tab ? '500' : '400',
  })

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', justifyContent: 'flex-end', zIndex: 200,
    }}>
      {/* Backdrop click to close */}
      <div style={{ flex: 1 }} onClick={onClose} />

      {/* Panel */}
      <div className="detail-panel" style={{
        width: '480px', maxWidth: '95vw', height: '100vh',
        background: 'var(--bg-card)', overflowY: 'auto',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '0.5px solid #e8e8e8' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: '500' }}>{job.company_name}</h2>
              <p style={{ margin: '3px 0 8px', fontSize: '13px', color: '#666' }}>{job.job_title}</p>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ background: badge.bg, color: badge.color, padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500' }}>
                  {job.status}
                </span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>{job.platform}</span>
                <span style={{ fontSize: '12px', color: '#aaa' }}>
                  Applied {job.applied_at ? new Date(job.applied_at).toLocaleDateString('en-IN') : '—'}
                </span>
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#aaa' }}>×</button>
          </div>

          {/* Job URL */}
          {job.job_url && (
            <a href={job.job_url} target="_blank" rel="noreferrer"
              style={{ fontSize: '12px', color: '#185FA5', marginTop: '8px', display: 'inline-block' }}>
              View original job posting ↗
            </a>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid #e8e8e8', padding: '0 24px' }}>
          <button style={tabStyle('overview')} onClick={() => setActiveTab('overview')}>Overview</button>
          <button style={tabStyle('outreach')} onClick={() => setActiveTab('outreach')}>
            Outreach {logs.length > 0 && `(${logs.length})`}
          </button>
          <button style={tabStyle('recruiters')} onClick={() => setActiveTab('recruiters')}>
            Recruiters {recruiters.length > 0 && `(${recruiters.length})`}
          </button>
          <button style={tabStyle('timeline')} onClick={() => setActiveTab('timeline')}>Timeline</button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '20px 24px', flex: 1 }}>

          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div>
              <p style={{ fontSize: '12px', fontWeight: '500', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Notes</p>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes about this application — interview rounds, contact details, salary discussed, anything relevant..."
                style={{
                  width: '100%', height: '180px', padding: '10px 12px',
                  border: '0.5px solid #ddd', borderRadius: '8px',
                  fontSize: '13px', fontFamily: 'inherit', resize: 'vertical',
                  boxSizing: 'border-box', outline: 'none', lineHeight: 1.6,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={saveNotes} disabled={savingNotes} style={{
                  padding: '7px 18px', borderRadius: '8px', background: '#185FA5',
                  color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500',
                }}>
                  {savingNotes ? 'Saving...' : 'Save notes'}
                </button>
              </div>

              {/* Quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '20px' }}>
                {[
                  { label: 'Outreach sent', value: logs.length },
                  { label: 'Replies received', value: logs.filter(l => l.reply_received).length },
                  { label: 'Recruiters found', value: recruiters.length },
                  { label: 'Days since applied', value: job.applied_at ? Math.floor((new Date() - new Date(job.applied_at)) / 86400000) : '—' },
                ].map(stat => (
                  <div key={stat.label} style={{ background: '#f8f8f8', borderRadius: '8px', padding: '12px' }}>
                    <p style={{ margin: 0, fontSize: '20px', fontWeight: '500', color: '#185FA5' }}>{stat.value}</p>
                    <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Outreach tab */}
          {activeTab === 'outreach' && (
            <div>
              {logs.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px', fontSize: '13px' }}>
                  No outreach sent yet. Click "Outreach" on the dashboard to send a cold email.
                </p>
              ) : (
                logs.map(log => (
                  <div key={log.id} style={{ border: '0.5px solid #e8e8e8', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{log.subject}</p>
                        <p style={{ margin: '3px 0', fontSize: '12px', color: '#888' }}>
                          To: {log.recruiter_name || log.recruiter_email || 'Unknown'}
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>
                          {new Date(log.sent_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      {log.reply_received ? (
                        <span style={{ fontSize: '11px', color: '#3B6D11', background: '#EAF3DE', padding: '3px 8px', borderRadius: '10px', flexShrink: 0 }}>Replied</span>
                      ) : (
                        <button onClick={() => handleMarkReply(log.id)} style={{ fontSize: '11px', color: '#854F0B', background: '#FAEEDA', padding: '3px 8px', borderRadius: '10px', border: 'none', cursor: 'pointer', flexShrink: 0 }}>
                          Mark replied
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Recruiters tab */}
          {activeTab === 'recruiters' && (
            <div>
              {recruiters.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#aaa', marginTop: '40px', fontSize: '13px' }}>
                  No recruiters saved yet. Use the Outreach panel to find and save contacts.
                </p>
              ) : (
                recruiters.map(r => (
                  <div key={r.id} style={{ border: '0.5px solid #e8e8e8', borderRadius: '8px', padding: '12px', marginBottom: '10px' }}>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{r.name}</p>
                    <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#888' }}>{r.email}</p>
                    {r.linkedin_url && (
                      <a href={r.linkedin_url} target="_blank" rel="noreferrer"
                        style={{ fontSize: '12px', color: '#0A66C2', marginTop: '4px', display: 'inline-block' }}>
                        LinkedIn profile ↗
                      </a>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Timeline tab */}
          {activeTab === 'timeline' && (
            <div>
              <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '16px' }}>
                Status journey for this application
              </p>
              {statusOrder.map((status, i) => {
                const currentIndex = statusOrder.indexOf(job.status)
                const isPast = i < currentIndex
                const isCurrent = i === currentIndex
                const isFuture = i > currentIndex
                const color = statusColors[status]
                return (
                  <div key={status} style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                        background: isFuture ? '#f5f5f5' : color.bg,
                        border: `0.5px solid ${isFuture ? '#e0e0e0' : color.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', color: isFuture ? '#ccc' : color.color, fontWeight: '500',
                      }}>
                        {isPast ? '✓' : isCurrent ? '●' : '○'}
                      </div>
                      {i < statusOrder.length - 1 && (
                        <div style={{ width: '1px', flex: 1, minHeight: '20px', background: isPast ? '#185FA5' : '#e0e0e0', marginTop: '4px' }} />
                      )}
                    </div>
                    <div style={{ paddingTop: '4px', paddingBottom: '16px' }}>
                      <p style={{ margin: 0, fontSize: '14px', fontWeight: isCurrent ? '500' : '400', color: isFuture ? '#ccc' : '#1a1a1a' }}>
                        {status}
                      </p>
                      {isCurrent && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>Current status</p>
                      )}
                      {status === 'Applied' && job.applied_at && (
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                          {new Date(job.applied_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
