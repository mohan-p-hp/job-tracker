import React, { useEffect, useState } from 'react'
import { getAllJobs } from '../api/jobs'
import JobCard from '../components/JobCard'
import AddJobModal from '../components/AddJobModal'
import RecruiterPanel from '../components/RecruiterPanel'
import JobDetailPanel from '../components/JobDetailPanel'

const statCard = (label, value, color) => (
  <div style={{
    background: 'var(--stat-bg)',
    border: '0.5px solid var(--border)',
    borderRadius: '10px', padding: '16px 20px', minWidth: '120px',
  }}>
    <div style={{ fontSize: '24px', fontWeight: '500', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{label}</div>
  </div>
)

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [statusFilter, setStatusFilter] = useState('All')
  const [editingJob, setEditingJob] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [detailJob, setDetailJob] = useState(null)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await getAllJobs()
      setJobs(res.data)
      setFiltered(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchJobs() }, [])

  useEffect(() => {
    let result = jobs

    // Apply status filter
    if (statusFilter !== 'All') {
      result = result.filter(j => j.status === statusFilter)
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(j =>
        j.company_name.toLowerCase().includes(q) ||
        j.job_title.toLowerCase().includes(q) ||
        (j.platform || '').toLowerCase().includes(q)
      )
    }

    setFiltered(result)
  }, [statusFilter, searchQuery, jobs])

  const counts = {
    total: jobs.length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
  }

  const statuses = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted']

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>
      <div className="stats-row" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px', marginBottom: '28px',
      }}>
        {statCard('Total applied', counts.total, '#185FA5')}
        {statCard('Interviewing', counts.interviewing, '#854F0B')}
        {statCard('Offers', counts.offers, '#3B6D11')}
        {statCard('Rejected', counts.rejected, '#A32D2D')}
      </div>
      {/* Toolbar */}
      <div className="toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>

        {/* Left side — status filters */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: statusFilter === s ? '#185FA5' : 'var(--border-input)',
              background: statusFilter === s ? 'var(--badge-applied-bg)' : 'var(--bg-card)',
              color: statusFilter === s ? '#185FA5' : 'var(--text-secondary)',
              fontWeight: statusFilter === s ? '500' : '400',
            }}>{s}</button>
          ))}
        </div>

        {/* Right side — search + add */}
        <div className="toolbar-right" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Search company or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                padding: '7px 32px 7px 12px',
                border: '0.5px solid var(--border-input)',
                borderRadius: '8px',
                fontSize: '13px',
                width: '220px',
                outline: 'none',
                fontFamily: 'inherit',
                background: 'var(--bg-input)',
                color: 'var(--text)',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '8px', top: '50%',
                  transform: 'translateY(-50%)', background: 'none',
                  border: 'none', cursor: 'pointer', fontSize: '14px',
                  color: '#aaa', padding: '0', lineHeight: 1,
                }}
              >
                ×
              </button>
            )}
          </div>
          <button onClick={() => setShowModal(true)} style={{
            padding: '8px 20px', borderRadius: '8px', background: '#185FA5',
            color: '#fff', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
          }}>
            + Add job
          </button>
        </div>

      </div>
      <div style={{ background: 'var(--bg-card)', border: '0.5px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading jobs...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            {searchQuery
              ? `No jobs matching "${searchQuery}" — try a different search term`
              : 'No jobs found. Click "+ Add job" to get started.'}
          </p>
        ) : (
          <table className="jobs-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--table-header)', borderBottom: '0.5px solid var(--border)' }}>
                {['Company', 'Role', 'Platform', 'Status', 'Applied on', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: 'var(--text-muted)', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <JobCard key={job.id} job={job} onRefresh={fetchJobs} onOpenPanel={setSelectedJob} onEdit={setEditingJob} onViewDetail={setDetailJob} />
              ))}
            </tbody>
          </table>
        )}
      </div>
      {showModal && (
        <AddJobModal
          onClose={() => setShowModal(false)}
          onJobAdded={fetchJobs}
        />
      )}
      {editingJob && (
        <AddJobModal
          onClose={() => setEditingJob(null)}
          onJobAdded={fetchJobs}
          existingJob={editingJob}
        />
      )}
      {selectedJob && (
        <RecruiterPanel
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
      {detailJob && (
        <JobDetailPanel
          job={detailJob}
          onClose={() => setDetailJob(null)}
          onRefresh={fetchJobs}
        />
      )}
    </div>
  )
}
