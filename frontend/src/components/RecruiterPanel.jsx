import React, { useState, useEffect } from 'react'
import { lookupRecruiters, sendOutreach, getOutreachLogs, markReply } from '../api/jobs'
import toast from 'react-hot-toast'
import axios from 'axios'

const inputStyle = {
  width: '100%', padding: '7px 10px', border: '0.5px solid #ddd',
  borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box',
  fontFamily: 'inherit', outline: 'none',
}

export default function RecruiterPanel({ job, onClose }) {
  const [domain, setDomain] = useState('')
  const [recruiters, setRecruiters] = useState([])
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(null)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualEmail, setManualEmail] = useState('')
  const [manualLinkedIn, setManualLinkedIn] = useState('')

  useEffect(() => {
    const guessed = job.company_name.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com'
    setDomain(guessed)
    setSubject(`Regarding ${job.job_title} role at ${job.company_name}`)
    setMessage(`Hi [Name],\n\nI recently applied for the ${job.job_title} position at ${job.company_name} and wanted to reach out directly.\n\nI am a software developer passionate about building impactful products. I believe my skills align well with this role and would love the opportunity to discuss further.\n\nWould you be open to a quick 15-minute call this week?\n\nBest regards,\nYour Name`)
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    try {
      const res = await getOutreachLogs(job.id)
      setLogs(Array.isArray(res.data) ? res.data : [])
    } catch {
      setLogs([])
    }
  }

  const handleLookup = async () => {
    if (!domain) { toast.error('Enter a domain first'); return }
    setLoading(true)
    try {
      const res = await lookupRecruiters(job.company_name, domain, job.id)
      setRecruiters(res.data.recruiters || [])
      if (!res.data.recruiters.length)
        toast('No contacts found — try a different domain or add manually')
      else
        toast.success(`Found ${res.data.recruiters.length} contacts via Snov.io`)
    } catch {
      toast.error('Lookup failed — check your Snov.io keys in .env')
    } finally {
      setLoading(false)
    }
  }

  const addManual = async () => {
    if (!manualName) { toast.error('Name is required'); return }
    if (!manualEmail && !manualLinkedIn) {
      toast.error('Add either an email or LinkedIn URL')
      return
    }
    const r = {
      name: manualName,
      email: manualEmail || '',
      linkedin_url: manualLinkedIn || '',
      position: 'Manual entry',
      confidence: 100,
      source: 'Manual',
    }

    // Save to database
    try {
      await axios.post('/recruiters', {
        application_id: job.id,
        name: r.name,
        email: r.email,
        linkedin_url: r.linkedin_url,
        company: job.company_name,
      })
    } catch {
      // Non-blocking — still add to UI even if DB save fails
    }

    setRecruiters(prev => [...prev, r])
    setSelected(r)
    setManualName('')
    setManualEmail('')
    setManualLinkedIn('')
    toast.success('Recruiter added and saved')
  }

  const handleSend = async () => {
    if (!selected) { toast.error('Select a recruiter first'); return }
    if (!subject || !message) { toast.error('Subject and message required'); return }
    setSending(true)
    try {
      const personalizedMsg = message.replace('[Name]', selected.name.split(' ')[0])
      await sendOutreach({
        recruiter_id: null,
        application_id: job.id,
        to_email: selected.email,
        to_name: selected.name,
        subject,
        message: personalizedMsg,
      })
      toast.success(`Email sent to ${selected.name}!`)
      setSelected(null)
      fetchLogs()
    } catch {
      toast.error('Failed to send — check your Brevo API key')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', width: '640px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '17px' }}>Recruiter outreach</h2>
            <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#888' }}>{job.company_name} — {job.job_title}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        {/* Credit banner */}
        <div style={{ background: '#EEEDFE', borderRadius: '8px', padding: '10px 14px', marginBottom: '20px', fontSize: '12px', color: '#534AB7' }}>
          Snov.io — 50 free searches/month. Add recruiters manually below if you run out.
        </div>

        {/* Step 1 — Find recruiters */}
        <div style={{ background: '#f8f8f8', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Step 1 — find recruiters</p>

          {/* LinkedIn search buttons */}
          <div style={{ marginBottom: '12px' }}>
            <p style={{ fontSize: '12px', color: '#888', margin: '0 0 8px' }}>
              Search directly on LinkedIn — works for every company including Indian startups:
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => {
                const query = encodeURIComponent(`HR recruiter ${job.company_name}`)
                window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, '_blank')
              }} style={{ padding: '7px 14px', borderRadius: '6px', background: '#0A66C2', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Search HR on LinkedIn
              </button>
              <button onClick={() => {
                const query = encodeURIComponent(`talent acquisition ${job.company_name}`)
                window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, '_blank')
              }} style={{ padding: '7px 14px', borderRadius: '6px', background: '#0A66C2', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Search Talent on LinkedIn
              </button>
              <button onClick={() => {
                const query = encodeURIComponent(`founder CEO ${job.company_name}`)
                window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, '_blank')
              }} style={{ padding: '7px 14px', borderRadius: '6px', background: '#534AB7', color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', fontWeight: '500' }}>
                Search Founder on LinkedIn
              </button>
            </div>
            <p style={{ fontSize: '11px', color: '#aaa', margin: '8px 0 0' }}>
              Find the person → copy their name and email → paste below in "Add manually"
            </p>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '12px 0' }}>
            <div style={{ flex: 1, height: '0.5px', background: '#e0e0e0' }} />
            <span style={{ fontSize: '11px', color: '#aaa' }}>or try auto-search</span>
            <div style={{ flex: 1, height: '0.5px', background: '#e0e0e0' }} />
          </div>

          {/* Snov.io auto search */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              style={{ ...inputStyle, flex: 1 }}
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="company.com"
            />
            <button onClick={handleLookup} disabled={loading} style={{
              padding: '7px 16px', borderRadius: '6px', background: '#185FA5',
              color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap'
            }}>
              {loading ? 'Searching...' : 'Auto-find'}
            </button>
          </div>
          <p style={{ fontSize: '11px', color: '#aaa', margin: '6px 0 0' }}>
            Snov.io auto-search — works best for large global companies (Google, Microsoft, etc.)
          </p>
        </div>

        {/* Step 2 — Results */}
        {recruiters.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Step 2 — select a recruiter</p>
            {recruiters.map((r, i) => (
              <div key={i} onClick={() => setSelected(r)} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 12px', borderRadius: '8px', marginBottom: '6px', cursor: 'pointer',
                border: `0.5px solid ${selected?.email === r.email ? '#185FA5' : '#e8e8e8'}`,
                background: selected?.email === r.email ? '#E6F1FB' : '#fff',
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '500' }}>{r.name}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>
                    {r.position}
                    {r.email && ` · ${r.email}`}
                    {r.linkedin_url && (
                      <a
                        href={r.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ color: '#0A66C2', marginLeft: '8px', fontSize: '11px', textDecoration: 'none' }}
                      >
                        LinkedIn ↗
                      </a>
                    )}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '11px', background: r.source === 'Manual' ? '#F1EFE8' : '#EEEDFE', color: r.source === 'Manual' ? '#5F5E5A' : '#534AB7', padding: '2px 8px', borderRadius: '10px' }}>{r.source}</span>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>{r.confidence}%</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Manual entry */}
        <div style={{ background: 'var(--bg-surface)', borderRadius: '8px', padding: '14px', marginBottom: '16px' }}>
          <p style={{ fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
            Add recruiter manually
          </p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '0 0 10px' }}>
            Found them on LinkedIn? Fill in their details here.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                style={{ ...inputStyle, flex: 1, minWidth: '140px' }}
                value={manualName}
                onChange={e => setManualName(e.target.value)}
                placeholder="Full name *"
              />
              <input
                style={{ ...inputStyle, flex: 1, minWidth: '160px' }}
                value={manualEmail}
                onChange={e => setManualEmail(e.target.value)}
                placeholder="email@company.com"
              />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                style={{ ...inputStyle, flex: 1 }}
                value={manualLinkedIn}
                onChange={e => setManualLinkedIn(e.target.value)}
                placeholder="https://linkedin.com/in/their-profile"
              />
              <button onClick={addManual} style={{
                padding: '7px 14px', borderRadius: '6px', background: '#534AB7',
                color: '#fff', border: 'none', fontSize: '13px', cursor: 'pointer', whiteSpace: 'nowrap',
              }}>
                Add
              </button>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>
              Email or LinkedIn URL required — both is ideal
            </p>
          </div>
        </div>

        {/* Step 3 — Compose */}
        {selected && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Step 3 — compose and send</p>
            <p style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
              Sending to: <strong style={{ fontWeight: '500' }}>{selected.name}</strong> ({selected.email})
            </p>
            <input style={{ ...inputStyle, marginBottom: '8px' }} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
            <textarea style={{ ...inputStyle, height: '160px', resize: 'vertical' }} value={message} onChange={e => setMessage(e.target.value)} />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => setSelected(null)} style={{ padding: '7px 16px', borderRadius: '6px', border: '0.5px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              <button onClick={handleSend} disabled={sending} style={{ padding: '7px 20px', borderRadius: '6px', background: '#185FA5', color: '#fff', border: 'none', fontSize: '13px', fontWeight: '500', cursor: 'pointer' }}>
                {sending ? 'Sending...' : 'Send email'}
              </button>
            </div>
          </div>
        )}

        {/* Outreach history */}
        {logs.length > 0 && (
          <div>
            <p style={{ fontSize: '12px', fontWeight: '500', color: '#666', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>Outreach history</p>
            {logs.map(log => (
              <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', border: '0.5px solid #e8e8e8', borderRadius: '8px', marginBottom: '6px' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '13px', fontWeight: '500' }}>{log.subject}</p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#888' }}>
                    {log.recruiter_name || log.recruiter_email} · {new Date(log.sent_at).toLocaleDateString('en-IN')}
                  </p>
                </div>
                {log.reply_received ? (
                  <span style={{ fontSize: '12px', color: '#3B6D11', background: '#EAF3DE', padding: '3px 10px', borderRadius: '10px' }}>Replied</span>
                ) : (
                  <button onClick={async () => { await markReply(log.id); fetchLogs(); toast.success('Reply marked!') }}
                    style={{ fontSize: '12px', color: '#854F0B', background: '#FAEEDA', padding: '3px 10px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>
                    Mark replied
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
