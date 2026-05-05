import React, { useState } from 'react'
import { deleteJob, updateJob } from '../api/jobs'
import toast from 'react-hot-toast'
import RecruiterPanel from './RecruiterPanel'
import ConfirmModal from './ConfirmModal'

const statusColors = {
  Applied:      { bg: '#E6F1FB', color: '#185FA5' },
  Interviewing: { bg: '#FAEEDA', color: '#854F0B' },
  Offer:        { bg: '#EAF3DE', color: '#3B6D11' },
  Rejected:     { bg: '#FCEBEB', color: '#A32D2D' },
  Ghosted:      { bg: '#F1EFE8', color: '#5F5E5A' },
}

const statusOrder = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted']

export default function JobCard({ job, onRefresh, onOpenPanel, onEdit, onViewDetail }) {
  const [currentStatus, setCurrentStatus] = useState(job.status)
  const [updating, setUpdating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const badge = statusColors[currentStatus] || statusColors['Applied']

  const handleStatusClick = async () => {
    if (updating) return
    const nextStatus = statusOrder[(statusOrder.indexOf(currentStatus) + 1) % statusOrder.length]
    setUpdating(true)
    try {
      await updateJob(job.id, {
        company_name: job.company_name,
        job_title: job.job_title,
        job_url: job.job_url,
        platform: job.platform,
        status: nextStatus,
        applied_at: job.applied_at,
        notes: job.notes,
      })
      setCurrentStatus(nextStatus)
      toast.success(`Status updated to ${nextStatus}`)
      onRefresh()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteJob(job.id)
      toast.success('Job deleted')
      onRefresh()
    } catch {
      toast.error('Failed to delete')
    } finally {
      setShowConfirm(false)
    }
  }

  return (
    <>
      <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
        <td data-label="Company"
          onClick={() => onViewDetail(job)}
          style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', color: '#185FA5' }}
        >
          {job.company_name}
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: '400' }}>↗</span>
        </td>
        <td data-label="Role" style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--text-secondary)' }}>{job.job_title}</td>
        <td data-label="Platform" style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>{job.platform}</td>
        <td data-label="Status" style={{ padding: '14px 16px' }}>
          <span
            onClick={handleStatusClick}
            title="Click to update status"
            style={{
              background: badge.bg, color: badge.color,
              padding: '4px 10px', borderRadius: '20px',
              fontSize: '12px', fontWeight: '500',
              cursor: updating ? 'wait' : 'pointer',
              userSelect: 'none', opacity: updating ? 0.6 : 1,
              transition: 'opacity .2s', display: 'inline-flex',
              alignItems: 'center', gap: '4px',
            }}
          >
            {currentStatus}
            <span style={{ fontSize: '10px', opacity: 0.6 }}>↻</span>
          </span>
        </td>
        <td data-label="Applied" style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {job.applied_at ? new Date(job.applied_at).toLocaleDateString('en-IN') : '—'}
        </td>
        <td data-label="" className="actions-cell" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => onOpenPanel(job)} style={{ background: 'var(--badge-applied-bg)', border: 'none', color: '#185FA5', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer', fontWeight: '500' }}>
              Outreach
            </button>
            <button onClick={() => onEdit(job)} style={{ background: 'var(--hover-bg)', border: 'none', color: 'var(--text-secondary)', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
              Edit
            </button>
            <button onClick={() => setShowConfirm(true)} style={{ background: 'none', border: '0.5px solid #f09595', color: '#A32D2D', borderRadius: '6px', padding: '4px 10px', fontSize: '12px', cursor: 'pointer' }}>
              Delete
            </button>
          </div>
        </td>
      </tr>

      {showConfirm && (
        <ConfirmModal
          title="Delete application?"
          message={`This will permanently delete your application to ${job.company_name} (${job.job_title}). This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
