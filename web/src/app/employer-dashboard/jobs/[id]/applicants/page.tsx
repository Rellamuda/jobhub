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

  // For reviewing application and resume
  const [reviewingApp, setReviewingApp] = useState<any>(null);

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                        {app.jobSeekerProfile?.firstName} {app.jobSeekerProfile?.lastName}
                      </div>
                      {app.aiMatchScore && (
                        <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                          ⭐ {app.aiMatchScore}% Match
                        </span>
                      )}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.3rem 0 0.6rem 0' }}>
                      {app.jobSeekerProfile?.headline || app.jobSeekerProfile?.profession || 'Job Seeker'}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setReviewingApp(app)}
                      style={{ 
                        width: '100%', 
                        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(0, 240, 255, 0.2) 100%)', 
                        border: '1px solid rgba(0, 240, 255, 0.4)', 
                        color: 'white', 
                        padding: '6px 10px', 
                        borderRadius: '6px', 
                        fontSize: '0.82rem', 
                        cursor: 'pointer', 
                        fontWeight: 'bold',
                        marginBottom: '0.6rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.4rem'
                      }}
                    >
                      📄 View & Review Resume
                    </button>
                    
                    {col === 'INVITED' && app.interviewDate && (
                      <div style={{ background: 'rgba(0,240,255,0.1)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                        📅 {new Date(app.interviewDate).toLocaleString()}
                        {app.interviewLink && <div>🔗 <a href={app.interviewLink} target="_blank" rel="noreferrer" style={{ color: '#00f0ff' }}>Join Link</a></div>}
                      </div>
                    )}

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
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

      {/* Review Application & Resume Modal */}
      {reviewingApp && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
          <div className="glass-panel" style={{ width: '800px', maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', background: '#120b1c', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1.2rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>
                    {reviewingApp.jobSeekerProfile?.firstName} {reviewingApp.jobSeekerProfile?.lastName}
                  </h2>
                  {reviewingApp.aiMatchScore && (
                    <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '3px 10px', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 'bold', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
                      ⭐ {reviewingApp.aiMatchScore}% Match
                    </span>
                  )}
                  <span style={{ background: 'rgba(255,255,255,0.1)', color: 'white', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem' }}>
                    Status: {reviewingApp.status}
                  </span>
                </div>
                <p style={{ margin: '6px 0 0 0', color: 'var(--primary-color)', fontSize: '1rem', fontWeight: 600 }}>
                  {reviewingApp.jobSeekerProfile?.headline || reviewingApp.jobSeekerProfile?.profession || 'Job Seeker'}
                </p>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  📍 {reviewingApp.jobSeekerProfile?.residenceCity || 'Remote'}, {reviewingApp.jobSeekerProfile?.residenceCountry || 'Global'}
                  {reviewingApp.jobSeekerProfile?.phone && ` • 📞 ${reviewingApp.jobSeekerProfile.phone}`}
                  {reviewingApp.jobSeekerProfile?.user?.email && ` • ✉️ ${reviewingApp.jobSeekerProfile.user.email}`}
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setReviewingApp(null)}
                style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '1.5rem', cursor: 'pointer', padding: '0 8px' }}
              >
                ✕
              </button>
            </div>

            {/* Quick Decision Actions Bar */}
            <div style={{ background: 'rgba(255,255,255,0.04)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.8rem', border: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Make Final Decision:</span>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => { updateStatus(reviewingApp.id, 'SHORTLISTED'); setReviewingApp({ ...reviewingApp, status: 'SHORTLISTED' }); }}
                  style={{ background: 'rgba(0, 240, 255, 0.15)', border: '1px solid #00f0ff', color: '#00f0ff', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⭐ Shortlist
                </button>
                <button
                  type="button"
                  onClick={() => { setSchedulingAppId(reviewingApp.id); setReviewingApp(null); }}
                  style={{ background: 'rgba(99, 102, 241, 0.2)', border: '1px solid #6366f1', color: 'white', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  📅 Schedule Interview
                </button>
                <button
                  type="button"
                  onClick={() => { updateStatus(reviewingApp.id, 'HIRED'); setReviewingApp({ ...reviewingApp, status: 'HIRED' }); }}
                  style={{ background: 'rgba(0, 255, 136, 0.15)', border: '1px solid #00ff88', color: '#00ff88', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  🎉 Hire Candidate
                </button>
                <button
                  type="button"
                  onClick={() => { updateStatus(reviewingApp.id, 'REJECTED'); setReviewingApp({ ...reviewingApp, status: 'REJECTED' }); }}
                  style={{ background: 'rgba(255, 51, 102, 0.15)', border: '1px solid #ff3366', color: '#ff3366', padding: '6px 14px', borderRadius: '6px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ✕ Reject
                </button>
              </div>
            </div>

            {/* Application Cover Letter */}
            {reviewingApp.coverLetter && (
              <div style={{ marginBottom: '1.8rem', padding: '1.2rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', borderLeft: '4px solid #00f0ff' }}>
                <h4 style={{ margin: '0 0 0.6rem 0', color: '#00f0ff', fontSize: '1rem' }}>✉️ Submitted Cover Letter</h4>
                <p style={{ margin: 0, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.9rem' }}>
                  {reviewingApp.coverLetter}
                </p>
              </div>
            )}

            {/* Candidate Resume Full Section */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#fff', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📄 Candidate Resume & Profile
              </h3>

              {/* Summary */}
              {(reviewingApp.resume?.summary || reviewingApp.jobSeekerProfile?.summary || reviewingApp.jobSeekerProfile?.bio) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', color: 'var(--primary-color)', fontSize: '1rem' }}>Professional Summary</h4>
                  <p style={{ margin: 0, color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '0.9rem' }}>
                    {reviewingApp.resume?.summary || reviewingApp.jobSeekerProfile?.summary || reviewingApp.jobSeekerProfile?.bio}
                  </p>
                </div>
              )}

              {/* Skills */}
              {(reviewingApp.resume?.skills || reviewingApp.jobSeekerProfile?.skills) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--primary-color)', fontSize: '1rem' }}>Skills & Competencies</h4>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {(Array.isArray(reviewingApp.resume?.skills) ? reviewingApp.resume.skills : (reviewingApp.jobSeekerProfile?.skills || [])).map((s: any, idx: number) => (
                      <span key={idx} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#fff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                        {typeof s === 'string' ? s : s.name || JSON.stringify(s)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Experience */}
              {((reviewingApp.resume?.experience && Array.isArray(reviewingApp.resume.experience) && reviewingApp.resume.experience.length > 0) || 
                (reviewingApp.jobSeekerProfile?.experience && Array.isArray(reviewingApp.jobSeekerProfile.experience) && reviewingApp.jobSeekerProfile.experience.length > 0)) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--primary-color)', fontSize: '1rem' }}>Work Experience</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {(reviewingApp.resume?.experience || reviewingApp.jobSeekerProfile?.experience || []).map((exp: any, idx: number) => (
                      <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #6366f1' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ color: '#fff', fontSize: '1rem' }}>{exp.role || exp.title}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{exp.dates || exp.year}</span>
                        </div>
                        <div style={{ color: '#00f0ff', fontSize: '0.88rem', margin: '2px 0 6px 0' }}>{exp.company}</div>
                        {exp.responsibilities && (
                          <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
                            {exp.responsibilities}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {((reviewingApp.resume?.education && Array.isArray(reviewingApp.resume.education) && reviewingApp.resume.education.length > 0) || 
                (reviewingApp.jobSeekerProfile?.education && Array.isArray(reviewingApp.jobSeekerProfile.education) && reviewingApp.jobSeekerProfile.education.length > 0)) && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.8rem 0', color: 'var(--primary-color)', fontSize: '1rem' }}>Education</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {(reviewingApp.resume?.education || reviewingApp.jobSeekerProfile?.education || []).map((ed: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.8rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <strong style={{ color: '#fff' }}>{ed.school || ed.institution}</strong>
                          <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{ed.dates || ed.yearGraduated}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '2px' }}>{ed.course || ed.degree}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects */}
              {reviewingApp.jobSeekerProfile?.projects && Array.isArray(reviewingApp.jobSeekerProfile.projects) && reviewingApp.jobSeekerProfile.projects.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.6rem 0', color: 'var(--primary-color)', fontSize: '1rem' }}>Projects & Portfolio</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.8rem' }}>
                    {reviewingApp.jobSeekerProfile.projects.map((proj: any, idx: number) => (
                      <div key={idx} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{proj.title}</strong>
                        <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{proj.description}</p>
                        {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noreferrer" style={{ color: '#00f0ff', fontSize: '0.8rem' }}>View Project ↗</a>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setReviewingApp(null)}
                className="btn-primary"
                style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 20px' }}
              >
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

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
