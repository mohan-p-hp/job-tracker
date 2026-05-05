import React from 'react';
import { deleteJob } from '../api/jobs';
import toast from 'react-hot-toast';

const statusColors = {
  Applied:      { bg: '#E6F1FB', color: '#185FA5' },
  Interviewing: { bg: '#FAEEDA', color: '#854F0B' },
  Offer:        { bg: '#EAF3DE', color: '#3B6D11' },
  Rejected:     { bg: '#FCEBEB', color: '#A32D2D' },
  Ghosted:      { bg: '#F1EFE8', color: '#5F5E5A' },
};

export default function JobCard({ job, onRefresh, onEdit }) {
  const badge = statusColors[job.status] || statusColors['Applied'];

  const handleDelete = async () => {
    if (!window.confirm(`Delete application to ${job.company_name}?`)) return;
    try {
      await deleteJob(job.id);
      toast.success('Job deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <tr style={{ borderBottom: '0.5px solid #f0f0f0' }}>
      <td style={{ padding: '14px 16px', fontSize: '14px', fontWeight: '500' }}>{job.company_name}</td>
      <td style={{ padding: '14px 16px', fontSize: '14px', color: '#444' }}>{job.job_title}</td>
      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888' }}>{job.platform}</td>
      <td style={{ padding: '14px 16px' }}>
        <span style={{
          background: badge.bg, color: badge.color,
          padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '500',
        }}>
          {job.status}
        </span>
      </td>
      <td style={{ padding: '14px 16px', fontSize: '13px', color: '#888' }}>
        {job.applied_at ? new Date(job.applied_at).toLocaleDateString('en-IN') : '—'}
      </td>
      <td style={{ padding: '14px 16px' }}>
        <button onClick={() => onEdit(job)} style={{
          background: 'none', border: '0.5px solid #ccc',
          color: '#444', borderRadius: '6px', padding: '4px 10px',
          fontSize: '12px', cursor: 'pointer', marginRight: '6px'
        }}>
          Edit
        </button>
        <button onClick={handleDelete} style={{
          background: 'none', border: '0.5px solid #f09595',
          color: '#A32D2D', borderRadius: '6px', padding: '4px 10px',
          fontSize: '12px', cursor: 'pointer',
        }}>
          Delete
        </button>
      </td>
    </tr>
  );
}
