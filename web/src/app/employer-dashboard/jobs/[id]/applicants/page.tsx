'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ApplicantsPage() {
  const { id: jobId } = useParams();
  const router = useRouter();
  const [applications, setApplications] = useState<any[]>([]);
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // For interview scheduling
  const [schedulingAppId, setSchedulingAppId] = useState<string | null>(null);
  const [interviewDate, setInterviewDate] = useState('');
  const [interviewLink, setInterviewLink] = useState('');

  useEffect(() => {
    const fetchApplicants = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return router.push('/login');

        const res = await fetch(`/api/applications/job/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          setApplications(data);
          if (data.length > 0 && data[0].job) {
            setJob(data[0].job);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (jobId) fetchApplicants();
  }, [jobId, router]);

  const updateStatus = async (appId: string, status: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setApplications(apps => apps.map(app => app.id === appId ? { ...app, status } : app));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const scheduleInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingAppId || !interviewDate) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/applications/${schedulingAppId}/schedule-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ interviewDate, interviewLink })
      });
      if (res.ok) {
        setApplications(apps => apps.map(app => app.id === schedulingAppId ? { ...app, status: 'INVITED', interviewDate, interviewLink } : app));
        setSchedulingAppId(null);
        setInterviewDate('');
        setInterviewLink('');
        alert('Interview scheduled successfully!');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const columns = ['APPLIED', 'SHORTLISTED', 'INVITED', 'HIRED', 'REJECTED'];

  if (loading) return <div style={{ textAlign: 'center', marginTop: '5rem' }}>Loading applicants...</div>;

  return (
    <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, fontSize: '2rem', color: 'var(--primary-color)' }}>
          Applicant Tracking {job ? `- ${job.title}` : ''}
        </h1>
        <Link href="/profile" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--primary-color)' }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
        {columns.map(col => {
          const colApps = applications.filter(a => a.status === col || (col === 'APPLIED' && a.status === 'VIEWED'));
          return (
            <div key={col} className="glass-panel" style={{ minWidth: '300px', flex: 1, padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                {col} ({colApps.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {colApps.map(app => (
                  <div key={app.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', borderLeft: `4px solid ${col === 'HIRED' ? '#00ff88' : col === 'REJECTED' ? '#ff3366' : 'var(--primary-color)'}` }}>
                    <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {app.jobSeekerProfile?.firstName} {app.jobSeekerProfile?.lastName}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.5rem 0' }}>
                      {app.jobSeekerProfile?.headline || 'Job Seeker'}
                    </div>
                    
                    {col === 'INVITED' && app.interviewDate && (
                      <div style={{ background: 'rgba(0,240,255,0.1)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        📅 {new Date(app.interviewDate).toLocaleString()}
                        {app.interviewLink && <div>🔗 <a href={app.interviewLink} target="_blank" rel="noreferrer" style={{ color: '#00f0ff' }}>Join Link</a></div>}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      <select 
                        value={app.status}
                        onChange={(e) => updateStatus(app.id, e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}
                      >
                        {columns.map(c => <option key={c} value={c}>Move to {c}</option>)}
                      </select>
                      
                      {app.status !== 'INVITED' && app.status !== 'REJECTED' && app.status !== 'HIRED' && (
                        <button 
                          onClick={() => setSchedulingAppId(app.id)}
                          style={{ background: 'rgba(0, 240, 255, 0.2)', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', cursor: 'pointer' }}
                        >
                          Schedule Interview
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {colApps.length === 0 && <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem 0' }}>No candidates</div>}
              </div>
            </div>
          );
        })}
      </div>

      {schedulingAppId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Schedule Interview</h2>
            <form onSubmit={scheduleInterview} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Date & Time</label>
                <input 
                  type="datetime-local" 
                  value={interviewDate} 
                  onChange={(e) => setInterviewDate(e.target.value)} 
                  required
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Meeting Link (Optional)</label>
                <input 
                  type="url" 
                  value={interviewLink} 
                  onChange={(e) => setInterviewLink(e.target.value)} 
                  placeholder="https://meet.google.com/..."
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setSchedulingAppId(null)} className="btn-primary" style={{ flex: 1, background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-secondary)' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Send Invite</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
