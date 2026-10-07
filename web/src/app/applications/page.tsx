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
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: userId, content: `Hi! We think you'd be a great fit for our recent job posting. We invite you to apply!` })
      });
      if (res.ok) alert('Invitation sent!');
    } catch (err) { console.error(err); }
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
                           <h3 style={{ margin: 0 }}>{app.jobSeekerProfile?.firstName} {app.jobSeekerProfile?.lastName}</h3>
                           <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>Status: {app.status}</p>
                         </div>
                         <button className="btn-primary" onClick={() => handleInvite(app.jobSeekerProfile.userId)} style={{ padding: '8px 16px', fontSize: '0.9rem' }}>Message</button>
                       </div>
                       {app.coverLetter && (
                         <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                           <strong>Cover Letter:</strong>
                           <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{app.coverLetter}</p>
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
                        <button className="btn-primary" style={{ padding: '8px 24px', fontSize: '0.9rem' }} onClick={() => handleInvite(m.userId)}>Invite to Apply</button>
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
    </main>
  );
}
