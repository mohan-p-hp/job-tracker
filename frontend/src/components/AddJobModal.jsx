import React, { useState } from 'react'
import { addJob, updateJob } from '../api/jobs'
import toast from 'react-hot-toast'

const inputStyle = {
  width: '100%', padding: '8px 12px', border: '0.5px solid #ccc',
  borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', marginTop: '4px',
}
const labelStyle = {
  fontSize: '13px', fontWeight: '500', color: '#444',
  display: 'block', marginBottom: '12px',
}

export default function AddJobModal({ onClose, onJobAdded, existingJob }) {
  const isEdit = !!existingJob

  const [form, setForm] = useState({
    company_name: existingJob?.company_name || '',
    job_title: existingJob?.job_title || '',
    job_url: existingJob?.job_url || '',
    platform: existingJob?.platform || 'LinkedIn',
    status: existingJob?.status || 'Applied',
    applied_at: existingJob?.applied_at
      ? new Date(existingJob.applied_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    notes: existingJob?.notes || '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async () => {
    if (!form.company_name || !form.job_title) {
      toast.error('Company name and job title are required')
      return
    }
    setLoading(true)
    try {
      if (isEdit) {
        await updateJob(existingJob.id, form)
        toast.success('Job updated successfully!')
      } else {
        await addJob(form)
        toast.success('Job added successfully!')
      }
      onJobAdded()
      onClose()
    } catch {
      toast.error(isEdit ? 'Failed to update job' : 'Failed to add job')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
    }}>
      <div className="modal-content" style={{
        background: 'var(--bg-card)', borderRadius: '12px',
        padding: '28px', width: '480px', maxWidth: '95vw',
        maxHeight: '90vh', overflowY: 'auto',
        border: '0.5px solid var(--border)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '18px' }}>
            {isEdit ? 'Edit job application' : 'Add job application'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>×</button>
        </div>

        <label style={labelStyle}>Company name *
          <input style={inputStyle} name="company_name" value={form.company_name} onChange={handleChange} placeholder="e.g. Google" />
        </label>
        <label style={labelStyle}>Job title *
          <input style={inputStyle} name="job_title" value={form.job_title} onChange={handleChange} placeholder="e.g. Software Engineer" />
        </label>
        <label style={labelStyle}>Job URL
          <input style={inputStyle} name="job_url" value={form.job_url} onChange={handleChange} placeholder="https://..." />
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <label style={labelStyle}>Platform
            <select style={inputStyle} name="platform" value={form.platform} onChange={handleChange}>
              <option>LinkedIn</option>
              <option>Indeed</option>
              <option>Naukri</option>
              <option>Company website</option>
              <option>Other</option>
            </select>
          </label>
          <label style={labelStyle}>Status
            <select style={inputStyle} name="status" value={form.status} onChange={handleChange}>
              <option>Applied</option>
              <option>Interviewing</option>
              <option>Offer</option>
              <option>Rejected</option>
              <option>Ghosted</option>
            </select>
          </label>
        </div>
        <label style={labelStyle}>Date applied
          <input style={inputStyle} type="date" name="applied_at" value={form.applied_at} onChange={handleChange} />
        </label>
        <label style={labelStyle}>Notes
          <textarea style={{ ...inputStyle, height: '80px', resize: 'vertical' }} name="notes" value={form.notes} onChange={handleChange} placeholder="Any details about this application..." />
        </label>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: '8px', border: '0.5px solid #ccc', background: '#fff', cursor: 'pointer', fontSize: '14px' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '8px 20px', borderRadius: '8px', border: 'none', background: '#185FA5', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            {loading ? 'Saving...' : isEdit ? 'Save changes' : 'Add job'}
          </button>
        </div>
      </div>
    </div>
  )
}
