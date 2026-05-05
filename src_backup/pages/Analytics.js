import React, { useEffect, useState } from 'react';
import { getAllJobs } from '../api/jobs';

export default function Analytics() {
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    getAllJobs().then(res => setJobs(res.data)).catch(console.error);
  }, []);

  const statuses = ['Applied', 'Interviewing', 'Offer', 'Rejected', 'Ghosted'];
  const colors   = ['#185FA5',  '#854F0B',      '#3B6D11','#A32D2D', '#5F5E5A'];
  const max = Math.max(...statuses.map(s => jobs.filter(j => j.status === s).length), 1);

  const byPlatform = ['LinkedIn','Indeed','Naukri','Company website','Other'].map(p => ({
    name: p, count: jobs.filter(j => j.platform === p).length,
  })).filter(p => p.count > 0);

  return (
    <div style={{ padding: '28px 32px', maxWidth: '900px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '500', marginBottom: '24px' }}>Analytics</h2>

      {/* Status breakdown bar chart */}
      <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: '10px', padding: '24px', marginBottom: '20px' }}>
        <p style={{ fontSize: '13px', fontWeight: '500', color: '#888', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Applications by status</p>
        {statuses.map((s, i) => {
          const count = jobs.filter(j => j.status === s).length;
          return (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span style={{ width: '90px', fontSize: '13px', color: '#555', flexShrink: 0 }}>{s}</span>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${(count / max) * 100}%`, background: colors[i], height: '10px', borderRadius: '4px', transition: 'width .5s' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '500', color: colors[i], width: '24px', textAlign: 'right' }}>{count}</span>
            </div>
          );
        })}
      </div>

      {/* Platform breakdown */}
      {byPlatform.length > 0 && (
        <div style={{ background: '#fff', border: '0.5px solid #e8e8e8', borderRadius: '10px', padding: '24px' }}>
          <p style={{ fontSize: '13px', fontWeight: '500', color: '#888', marginBottom: '20px', textTransform: 'uppercase', letterSpacing: '.05em' }}>Applications by platform</p>
          {byPlatform.map(p => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <span style={{ width: '130px', fontSize: '13px', color: '#555', flexShrink: 0 }}>{p.name}</span>
              <div style={{ flex: 1, background: '#f5f5f5', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${(p.count / max) * 100}%`, background: '#534AB7', height: '10px', borderRadius: '4px', transition: 'width .5s' }} />
              </div>
              <span style={{ fontSize: '13px', fontWeight: '500', color: '#534AB7', width: '24px', textAlign: 'right' }}>{p.count}</span>
            </div>
          ))}
        </div>
      )}

      {jobs.length === 0 && (
        <p style={{ textAlign: 'center', color: '#aaa', marginTop: '60px' }}>No data yet — add some jobs on the Dashboard first.</p>
      )}
    </div>
  );
}
