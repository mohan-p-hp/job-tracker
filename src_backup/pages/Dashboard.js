import React, { useEffect, useState } from 'react';
import { getAllJobs } from '../api/jobs';
import JobCard from '../components/JobCard';
import AddJobModal from '../components/AddJobModal';
import EditJobModal from '../components/EditJobModal';
import toast from 'react-hot-toast';

const statCard = (label, value, color) => (
  <div style={{
    background: '#fff', border: '0.5px solid #e8e8e8',
    borderRadius: '10px', padding: '16px 20px', minWidth: '120px',
  }}>
    <div style={{ fontSize: '24px', fontWeight: '500', color }}>{value}</div>
    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{label}</div>
  </div>
);

export default function Dashboard() {
  const [jobs, setJobs] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await getAllJobs();
      setJobs(res.data);
      setFiltered(res.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load jobs. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  useEffect(() => {
    let result = jobs;
    if (statusFilter !== 'All') {
      result = result.filter(j => j.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(j => j.company_name?.toLowerCase().includes(q));
    }
    setFiltered(result);
  }, [statusFilter, searchQuery, jobs]);

  const counts = {
    total: jobs.length,
    interviewing: jobs.filter(j => j.status === 'Interviewing').length,
    offers: jobs.filter(j => j.status === 'Offer').length,
    rejected: jobs.filter(j => j.status === 'Rejected').length,
  };

  const statuses = ['All', 'Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];

  return (
    <div style={{ padding: '28px 32px', maxWidth: '1100px', margin: '0 auto' }}>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', flexWrap: 'wrap' }}>
        {statCard('Total applied', counts.total, '#185FA5')}
        {statCard('Interviewing', counts.interviewing, '#854F0B')}
        {statCard('Offers', counts.offers, '#3B6D11')}
        {statCard('Rejected', counts.rejected, '#A32D2D')}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {statuses.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '5px 14px', borderRadius: '20px', fontSize: '13px', cursor: 'pointer',
              border: '0.5px solid',
              borderColor: statusFilter === s ? '#185FA5' : '#ddd',
              background: statusFilter === s ? '#E6F1FB' : '#fff',
              color: statusFilter === s ? '#185FA5' : '#666',
              fontWeight: statusFilter === s ? '500' : '400',
            }}>
              {s}
            </button>
          ))}
          <input 
            type="text" 
            placeholder="Search company..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '6px 12px', fontSize: '13px', borderRadius: '8px', border: '0.5px solid #ccc', marginLeft: '6px' }}
          />
        </div>
        <button onClick={() => setShowModal(true)} style={{
          padding: '8px 20px', borderRadius: '8px', background: '#185FA5',
          color: '#fff', border: 'none', fontSize: '14px', fontWeight: '500', cursor: 'pointer',
        }}>
          + Add job
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: '10px', overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#888' }}>Loading jobs...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '32px', textAlign: 'center', color: '#888' }}>
            No jobs found. Click "+ Add job" to track your first application.
          </p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#fafafa', borderBottom: '0.5px solid #e8e8e8' }}>
                {['Company', 'Role', 'Platform', 'Status', 'Applied on', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', fontSize: '12px', fontWeight: '500', color: '#888', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(job => (
                <JobCard 
                  key={job.id} 
                  job={job} 
                  onRefresh={fetchJobs} 
                  onEdit={(j) => setEditingJob(j)} 
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddJobModal onClose={() => setShowModal(false)} onJobAdded={fetchJobs} />}
      {editingJob && <EditJobModal job={editingJob} onClose={() => setEditingJob(null)} onJobUpdated={fetchJobs} />}
    </div>
  );
}
