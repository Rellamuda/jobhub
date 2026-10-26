'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function EmployerDashboard() {
  const [activeTab, setActiveTab] = useState<'JOBS' | 'MATCHES' | 'MESSAGES'>('JOBS');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Messaging state
  const [inbox, setInbox] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  // Matches state
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [matches, setMatches] = useState<any[]>([]);
  const [matching, setMatching] = useState(false);
  const [invitedUserIds, setInvitedUserIds] = useState<string[]>([]);
  const [viewingResume, setViewingResume] = useState<any | null>(null);

  const [selectedViewJobId, setSelectedViewJobId] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      try {
        const res = await fetch('/api/jobs/employer/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          if (data.length > 0) setSelectedJobId(data[0].id);
        }
      } catch (err) {
        setError('Error fetching data');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    if (activeTab === 'MESSAGES') {
      fetchInbox();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'MATCHES' && selectedJobId) {
      fetchMatches();
    }
  }, [activeTab, selectedJobId]);

  const fetchInbox = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages/inbox', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setInbox(await res.json());
    } catch (err) { console.error(err); }
  };

  const fetchChat = async (userId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/messages/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setChatMessages(await res.json());
        setSelectedChat(userId);
      }
    } catch (err) { console.error(err); }
  };

  const fetchMatches = async () => {
    setMatching(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/jobs/${selectedJobId}/matches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setMatches(await res.json());
    } catch (err) { console.error(err); } finally {
      setMatching(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: selectedChat, content: newMessage })
      });
      if (res.ok) {
        setNewMessage('');
        fetchChat(selectedChat);
      }
    } catch (err) { console.error(err); }
  };

  const handleInvite = async (userId: string) => {
    if (invitedUserIds.includes(userId)) {
      alert('Message already sent');
      return;
    }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: userId, content: `Hi! We think you'd be a great fit for our recent job posting. We invite you to apply!` })
      });
      if (res.ok) {
        setInvitedUserIds(prev => [...prev, userId]);
        alert('Invitation sent!');
      }
    } catch (err) { console.error(err); }
  };

  const updateApplicationStatus = async (appId: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/applications/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        setJobs(prevJobs => prevJobs.map(j => ({
          ...j,
          applications: j.applications?.map((a: any) => a.id === appId ? { ...a, status } : a)
        })));
        if (viewingResume && viewingResume.id === appId) {
          setViewingResume({ ...viewingResume, status });
        }
        alert(`Application status updated to ${status}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main style={{ padding: '2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }} className="text-gradient">Employer Dashboard</h1>
        <Link href="/jobs">
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--secondary-color)', boxShadow: 'none' }}>Back to Job Board</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button onClick={() => { setActiveTab('JOBS'); setSelectedViewJobId(null); }} style={{ background: 'none', border: 'none', color: activeTab === 'JOBS' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'JOBS' ? 'bold' : 'normal' }}>My Jobs</button>
        <button onClick={() => { setActiveTab('MATCHES'); setSelectedViewJobId(null); }} style={{ background: 'none', border: 'none', color: activeTab === 'MATCHES' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'MATCHES' ? 'bold' : 'normal' }}>Match Candidates</button>
        <button onClick={() => { setActiveTab('MESSAGES'); setSelectedViewJobId(null); }} style={{ background: 'none', border: 'none', color: activeTab === 'MESSAGES' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'MESSAGES' ? 'bold' : 'normal' }}>Messages</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {activeTab === 'JOBS' && (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
             {selectedViewJobId ? (
               <div>
                 <button onClick={() => setSelectedViewJobId(null)} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer', marginBottom: '1rem' }}>&larr; Back to Jobs List</button>
                 <h2 style={{marginTop:0}}>Applications for {jobs.find(j => j.id === selectedViewJobId)?.title}</h2>
                 {jobs.find(j => j.id === selectedViewJobId)?.applications?.length === 0 ? (
                   <p>No applications yet.</p>
                 ) : (
                   jobs.find(j => j.id === selectedViewJobId)?.applications?.map((app: any) => (
                     <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <div>
                            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {app.jobSeekerProfile?.firstName} {app.jobSeekerProfile?.lastName}
                              {app.jobSeekerProfile?.verificationStatus === 'VERIFIED' && <span style={{ color: '#00f0ff' }}>✔</span>}
                            </h3>
                            <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>Status: <span style={{ color: '#00f0ff', fontWeight: 'bold' }}>{app.status}</span> • AI Match: {app.aiMatchScore || 85}%</p>
                            {app.resume && (
                              <div style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#00f0ff' }}>
                                📄 Attached Resume: <strong>{app.resume.title || 'Candidate Resume'}</strong>
                              </div>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button 
                              className="btn-primary" 
                              onClick={() => setViewingResume(app)}
                              style={{ padding: '8px 16px', fontSize: '0.9rem', border: '1px solid #00f0ff' }}
                            >
                              📄 View Resume
                            </button>
                            <button className="btn-primary" onClick={() => handleInvite(app.jobSeekerProfile.userId)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                              {invitedUserIds.includes(app.jobSeekerProfile.userId) ? 'Message sent' : 'Message Seeker'}
                            </button>
                          </div>
                       </div>
                       {(app.resume?.summary || app.jobSeekerProfile?.summary || app.jobSeekerProfile?.bio) && (
                         <div style={{ marginTop: '0.8rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '3px solid #00f0ff' }}>
                           <strong style={{ fontSize: '0.82rem', color: '#00f0ff' }}>📄 Resume Summary:</strong>
                           <p style={{ margin: '4px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                             {app.resume?.summary || app.jobSeekerProfile?.summary || app.jobSeekerProfile?.bio}
                           </p>
                         </div>
                       )}
                       {(app.resume?.skills || app.jobSeekerProfile?.skills) && (
                         <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.6rem', alignItems: 'center' }}>
                           <strong style={{ fontSize: '0.8rem', color: 'white' }}>Key Skills:</strong>
                           {(Array.isArray(app.resume?.skills) ? app.resume.skills : (app.jobSeekerProfile?.skills || [])).slice(0, 6).map((s: any, idx: number) => (
                             <span key={idx} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#00f0ff', padding: '2px 8px', borderRadius: '8px', fontSize: '0.75rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                               {typeof s === 'string' ? s : s.name || JSON.stringify(s)}
                             </span>
                           ))}
                         </div>
                       )}
                       {app.coverLetter && (
                         <div style={{ marginTop: '0.8rem', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                           <strong style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Cover Letter:</strong>
                           <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{app.coverLetter}</p>
                         </div>
                       )}
                     </div>
                   ))
                 )}
               </div>
             ) : (
               jobs.length === 0 ? <p>You haven't posted any jobs yet.</p> : jobs.map(job => (
                 <div key={job.id} className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                     <h2 style={{ fontSize: '1.5rem', margin: 0 }}>{job.title}</h2>
                     <span style={{ background: 'rgba(0, 240, 255, 0.2)', color: '#00f0ff', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem', fontWeight: 'bold' }}>
                       {job._count?.applications || 0} Applications
                     </span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                     <button className="btn-primary" style={{ padding: '8px 24px', fontSize: '0.9rem' }} onClick={() => setSelectedViewJobId(job.id)}>
                       View Applications
                     </button>
                   </div>
                 </div>
               ))
             )}
            </div>
          )}

          {activeTab === 'MATCHES' && (
            <div className="glass-panel">
              <h2 style={{marginTop:0}}>Discover Top Candidates</h2>
              <select value={selectedJobId} onChange={(e) => setSelectedJobId(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '1rem', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}>
                {jobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
              </select>
              
              {matching ? <p>Finding best matches...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {matches.length === 0 ? <p>No exact matches found yet.</p> : matches.map(m => (
                    <div key={m.id} className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderLeft: '4px solid var(--primary-color)' }}>
                      <div style={{ display: 'flex', gap: '1.5rem' }}>
                        <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                          {m.profilePicture ? <img src={m.profilePicture} alt="Profile" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem'}}>👤</div>}
                        </div>
                        <div>
                          <h3 style={{margin:0, display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            {m.firstName} {m.lastName}
                            {m.verificationStatus === 'VERIFIED' && <span style={{ color: '#00f0ff', fontSize: '1.2rem' }} title="Verified">✔</span>}
                            <span style={{background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem'}}>Match: {m.matchScore} pts</span>
                          </h3>
                          <p style={{fontSize:'1rem', color: 'var(--secondary-color)', margin: '4px 0'}}>{m.headline || m.profession || 'Professional'}</p>
                          <p style={{fontSize:'0.9rem', color: 'var(--text-secondary)', margin: '4px 0'}}>{m.residenceCity}{m.residenceCountry && `, ${m.residenceCountry}`} • Exp: {m.expectedSalary || 'Negotiable'}</p>
                          {m.skills && m.skills.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                              {m.skills.slice(0, 5).map((s: string) => <span key={s} style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem'}}>{s}</span>)}
                              {m.skills.length > 5 && <span style={{background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem'}}>+{m.skills.length - 5}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button 
                          className="btn-primary" 
                          style={{ 
                            padding: '8px 24px', 
                            fontSize: '0.9rem',
                            background: invitedUserIds.includes(m.userId) ? 'rgba(255,255,255,0.15)' : undefined,
                            color: invitedUserIds.includes(m.userId) ? '#a1a1aa' : undefined,
                            cursor: invitedUserIds.includes(m.userId) ? 'default' : 'pointer'
                          }} 
                          onClick={() => handleInvite(m.userId)}
                        >
                          {invitedUserIds.includes(m.userId) ? 'Message already sent' : 'Invite to Apply'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'MESSAGES' && (
            <div style={{ display: 'flex', gap: '2rem', height: '600px' }}>
              <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                <h3 style={{marginTop:0}}>Inbox</h3>
                {inbox.map(thread => (
                  <div key={thread.otherUserId} onClick={() => fetchChat(thread.otherUserId)} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: selectedChat === thread.otherUserId ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                    <strong>{thread.otherUser?.jobSeekerProfile?.firstName || 'Candidate'}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      {thread.latestMessage.content.substring(0, 40)}...
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="glass-panel" style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
                {selectedChat ? (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {chatMessages.map(msg => (
                        <div key={msg.id} style={{ alignSelf: msg.senderId === selectedChat ? 'flex-start' : 'flex-end', background: msg.senderId === selectedChat ? 'rgba(255,255,255,0.1)' : 'var(--primary-color)', padding: '8px 16px', borderRadius: '16px' }}>
                          {msg.content}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input type="text" value={newMessage} onChange={(e)=>setNewMessage(e.target.value)} style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: 'white' }} placeholder="Type a message..." />
                      <button onClick={sendMessage} className="btn-primary" style={{ padding: '0 24px' }}>Send</button>
                    </div>
                  </>
                ) : (
                  <p style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--text-secondary)' }}>Select a conversation to start messaging</p>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Candidate Resume Full Modal */}
      {viewingResume && (() => {
        const profile = viewingResume.jobSeekerProfile || viewingResume.profile || {};
        const resume = viewingResume.resume || viewingResume;
        const skills: any[] = Array.isArray(resume.skills) ? resume.skills : (Array.isArray(profile.skills) ? profile.skills : []);
        const experience: any[] = Array.isArray(resume.experience) ? resume.experience : (Array.isArray(profile.experience) ? profile.experience : []);
        const education: any[] = Array.isArray(resume.education) ? resume.education : (Array.isArray(profile.education) ? profile.education : []);
        const projects: any[] = Array.isArray(resume.projects) ? resume.projects : (Array.isArray(profile.projects) ? profile.projects : (Array.isArray(profile.portfolio) ? profile.portfolio : []));

        return (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1.5rem',
          }}>
            <div className="glass-panel" style={{
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: '16px',
              border: '1px solid rgba(0, 240, 255, 0.3)',
              background: '#0d1117',
              color: '#f0f6fc',
              padding: '2rem',
              boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#fff' }}>
                      {profile.firstName || 'Candidate'} {profile.lastName || ''}
                    </h2>
                    {profile.verificationStatus === 'VERIFIED' && (
                      <span style={{ color: '#00f0ff', fontSize: '1.3rem' }} title="Verified Candidate">✔</span>
                    )}
                    <span style={{
                      background: 'rgba(0, 240, 255, 0.15)',
                      color: '#00f0ff',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      border: '1px solid rgba(0, 240, 255, 0.4)'
                    }}>
                      {viewingResume.aiMatchScore || 85}% Match
                    </span>
                    <span style={{
                      background: 'rgba(99, 102, 241, 0.2)',
                      color: '#a5b4fc',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.8rem',
                      fontWeight: 600
                    }}>
                      Status: {viewingResume.status}
                    </span>
                  </div>
                  <p style={{ margin: '6px 0 0 0', color: '#38bdf8', fontSize: '1rem', fontWeight: 500 }}>
                    {profile.headline || profile.profession || resume.title || 'Professional Candidate'}
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.88rem' }}>
                    📍 {[profile.residenceCity, profile.residenceCountry].filter(Boolean).join(', ') || 'Location on file'}
                    {profile.phone && ` • 📞 ${profile.phone}`}
                  </p>
                </div>
                <button
                  onClick={() => setViewingResume(null)}
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    color: '#fff',
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Action Toolbar */}
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '1.5rem', padding: '0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600, marginRight: '0.4rem' }}>Application Decision:</span>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.85rem', background: viewingResume.status === 'SHORTLISTED' ? '#22c55e' : undefined }}
                  onClick={() => updateApplicationStatus(viewingResume.id, 'SHORTLISTED')}
                >
                  ⭐ Shortlist
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: '6px 14px', fontSize: '0.85rem', background: viewingResume.status === 'HIRED' ? '#10b981' : 'linear-gradient(135deg, #10b981, #059669)' }}
                  onClick={() => updateApplicationStatus(viewingResume.id, 'HIRED')}
                >
                  🤝 Hire Candidate
                </button>
                <button
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.85rem',
                    background: viewingResume.status === 'REJECTED' ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                    color: '#f87171',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                  onClick={() => updateApplicationStatus(viewingResume.id, 'REJECTED')}
                >
                  ✕ Reject
                </button>
                {profile.userId && (
                  <button
                    className="btn-secondary"
                    style={{ padding: '6px 14px', fontSize: '0.85rem', marginLeft: 'auto' }}
                    onClick={() => handleInvite(profile.userId)}
                  >
                    💬 Message Candidate
                  </button>
                )}
              </div>

              {/* Resume Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
                {/* Professional Summary */}
                <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderLeft: '4px solid #00f0ff' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#00f0ff', fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Professional Summary
                  </h4>
                  <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.92rem' }}>
                    {resume.summary || profile.summary || profile.bio || 'Summary not provided.'}
                  </p>
                </div>

                {/* Key Skills */}
                {skills.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.6rem 0', color: '#fff', fontSize: '0.95rem' }}>
                      Key Skills & Competencies
                    </h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {skills.map((s: any, idx: number) => (
                        <span key={idx} style={{
                          background: 'rgba(0, 240, 255, 0.1)',
                          color: '#38bdf8',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          border: '1px solid rgba(0, 240, 255, 0.25)'
                        }}>
                          {typeof s === 'string' ? s : s.name || JSON.stringify(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Work Experience */}
                {experience.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#fff', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                      Work Experience
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                      {experience.map((exp: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#fff', fontSize: '0.95rem' }}>{exp.title || exp.role || 'Role'}</strong>
                            <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>
                              {exp.startDate || exp.period || ''} {exp.endDate ? `- ${exp.endDate}` : exp.current ? '- Present' : ''}
                            </span>
                          </div>
                          <div style={{ color: '#38bdf8', fontSize: '0.85rem', marginTop: '2px' }}>
                            {exp.company || exp.employer || ''}
                          </div>
                          {(exp.description || exp.responsibilities) && (
                            <p style={{ margin: '6px 0 0 0', color: '#cbd5e1', fontSize: '0.85rem', lineHeight: 1.5 }}>
                              {exp.description || exp.responsibilities}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {education.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#fff', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                      Education & Training
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {education.map((edu: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{edu.degree || edu.qualification || 'Degree'}</strong>
                            <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>{edu.institution || edu.school || ''}</div>
                          </div>
                          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{edu.year || edu.endYear || ''}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects & Portfolio */}
                {projects.length > 0 && (
                  <div>
                    <h4 style={{ margin: '0 0 0.8rem 0', color: '#fff', fontSize: '0.95rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.4rem' }}>
                      Projects & Portfolio
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {projects.map((proj: any, idx: number) => (
                        <div key={idx} style={{ padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{proj.title || proj.name || 'Project'}</strong>
                            {(proj.url || proj.link) && (
                              <a href={proj.url || proj.link} target="_blank" rel="noopener noreferrer" style={{ color: '#00f0ff', fontSize: '0.8rem' }}>
                                View Project ↗
                              </a>
                            )}
                          </div>
                          {proj.description && (
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '0.82rem' }}>{proj.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submitted Cover Letter (if requested/provided) */}
                {viewingResume.coverLetter && (
                  <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '10px', borderLeft: '4px solid #a855f7' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#c084fc', fontSize: '0.95rem' }}>
                      Submitted Cover Letter
                    </h4>
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.6 }}>
                      {viewingResume.coverLetter}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
