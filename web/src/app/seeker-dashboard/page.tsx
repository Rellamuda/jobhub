'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SeekerDashboard() {
  const [activeTab, setActiveTab] = useState<'APPLIED' | 'INVITATIONS' | 'MESSAGES' | 'ALERTS'>('APPLIED');
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [consentJobId, setConsentJobId] = useState<string | null>(null);
  const [consentNotificationId, setConsentNotificationId] = useState<string | null>(null);
  const [consentJobTitle, setConsentJobTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  
  // Messaging state
  const [inbox, setInbox] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const [profile, setProfile] = useState<any>(null);
  const [user, setUser] = useState<any>(null);

  // AI Insights State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);

  useEffect(() => {
    const fetchProfileAndApps = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      try {
        const authRes = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (authRes.ok) setUser(await authRes.json());
        
        const profRes = await fetch('/api/profiles/job-seeker', { headers: { 'Authorization': `Bearer ${token}` } });
        if (profRes.ok) setProfile(await profRes.json());

        const appRes = await fetch('/api/applications/my-applications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (appRes.ok) setApplications(await appRes.json());

        const notifRes = await fetch('/api/profiles/notifications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (notifRes.ok) setNotifications(await notifRes.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndApps();
  }, []);

  useEffect(() => {
    if (activeTab === 'MESSAGES') fetchInbox();
    if (activeTab === 'ALERTS') fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/profiles/notifications', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) { console.error(err); }
  };

  const applyWithConsent = async (notification: any) => {
    if (!notification.jobId) return;
    const token = localStorage.getItem('token');
    try {
      const applyRes = await fetch(`/api/applications/${notification.jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverLetter: "Applied automatically via Smart Match Alert with seeker consent."
        })
      });
      
      if (!applyRes.ok) {
        const errData = await applyRes.json();
        throw new Error(errData.message || 'Application failed');
      }

      await fetch(`/api/profiles/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      alert(`Successfully applied for the job!`);
      fetchNotifications();
      
      const appRes = await fetch('/api/applications/my-applications', { headers: { 'Authorization': `Bearer ${token}` } });
      if (appRes.ok) setApplications(await appRes.json());
      
      setConsentJobId(null);
      setConsentNotificationId(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const dismissAlert = async (notificationId: string) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/profiles/notifications/${notificationId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (err) { console.error(err); }
  };

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

  const respondToInvitation = async (appId: string, accept: boolean) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/applications/${appId}/seeker-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status: accept ? 'ACCEPTED_OFFER' : 'DECLINED_OFFER' })
      });
      if (res.ok) {
        alert(accept ? 'Invitation Accepted!' : 'Invitation Declined');
        setApplications(apps => apps.map(app => app.id === appId ? { ...app, status: accept ? 'ACCEPTED_OFFER' : 'DECLINED_OFFER' } : app));
      }
    } catch (err) { console.error(err); }
  };

  const regularApps = applications.filter(a => a.status !== 'INVITED' && a.status !== 'DECLINED_OFFER');
  const invitations = applications.filter(a => a.status === 'INVITED' || a.status === 'ACCEPTED_OFFER');

  const fetchAiInsights = async () => {
    setAiLoading(true);
    const token = localStorage.getItem('token');
    try {
      const pRes = await fetch('/api/ai/career/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const cSuggs = await pRes.json();
      
      const sRes = await fetch('/api/ai/salary/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ job_title: profile?.profession || 'Job Seeker', location: profile?.residenceCity || 'Unknown', experience_years: 3 })
      });
      const sEst = await sRes.json();

      const scoreRes = await fetch('/api/ai/profile/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(profile)
      });
      const scoreData = await scoreRes.json();

      setAiInsights({ suggestions: cSuggs.suggestions || [], salary: sEst, score: scoreData });
    } catch (err) {
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <main style={{ padding: '2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Centered Profile Section (Directly under the header) */}
      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '3rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', marginBottom: '1rem' }}>
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{profile.firstName} {profile.lastName}</h2>
          <p style={{ margin: '4px 0 1rem 0', color: 'var(--secondary-color)', fontSize: '1.1rem' }}>{profile.profession || 'Job Seeker'}</p>
          
          <button className="btn-primary" onClick={fetchAiInsights} disabled={aiLoading} style={{ background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', boxShadow: 'none' }}>
            {aiLoading ? 'Generating AI Insights...' : '✨ Generate AI Career Insights'}
          </button>

          {aiInsights && (
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'left', width: '100%', maxWidth: '600px', borderLeft: '4px solid #00f0ff' }}>
              <h3 style={{ marginTop: 0, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ AI Career Insights</h3>
              
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0' }}>Estimated Market Salary</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>{aiInsights.salary?.currency} {aiInsights.salary?.min?.toLocaleString()} - {aiInsights.salary?.max?.toLocaleString()}</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{aiInsights.salary?.reasoning}</p>
                </div>
                
                {aiInsights.score && (
                  <div style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0 }}>Resume Score</h4>
                      <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: aiInsights.score.score > 80 ? '#00ff00' : '#ff8c00' }}>
                        {aiInsights.score.score}/100
                      </span>
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {aiInsights.score.suggestions?.map((s: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '4px' }}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 0.5rem 0' }}>Career Path Suggestions</h4>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {aiInsights.suggestions?.map((s: string, idx: number) => (
                    <span key={idx} style={{ background: 'rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '16px', fontSize: '0.9rem' }}>{s}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.5rem', margin: 0 }} className="text-gradient">Job Seeker Dashboard</h1>
        <Link href="/jobs">
          <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--secondary-color)', boxShadow: 'none' }}>Back to Job Board</button>
        </Link>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <button onClick={() => setActiveTab('APPLIED')} style={{ background: 'none', border: 'none', color: activeTab === 'APPLIED' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'APPLIED' ? 'bold' : 'normal' }}>Applied Jobs</button>
        <button onClick={() => setActiveTab('INVITATIONS')} style={{ background: 'none', border: 'none', color: activeTab === 'INVITATIONS' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'INVITATIONS' ? 'bold' : 'normal' }}>Invitations & Offers</button>
        <button onClick={() => setActiveTab('MESSAGES')} style={{ background: 'none', border: 'none', color: activeTab === 'MESSAGES' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'MESSAGES' ? 'bold' : 'normal' }}>Messages</button>
        <button onClick={() => setActiveTab('ALERTS')} style={{ background: 'none', border: 'none', color: activeTab === 'ALERTS' ? '#00f0ff' : 'white', fontSize: '1.2rem', cursor: 'pointer', fontWeight: activeTab === 'ALERTS' ? 'bold' : 'normal', position: 'relative' }}>
          Match Alerts
          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-15px', background: '#ff4d4d', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%' }}>
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <>
          {activeTab === 'APPLIED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {regularApps.length === 0 ? <p>No job applications yet.</p> : regularApps.map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{app.job.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>{app.job.employer.companyName}</p>
                  </div>
                  <span style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.1)' }}>{app.status}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'INVITATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {invitations.length === 0 ? <p>No invitations yet.</p> : invitations.map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: app.status === 'INVITED' ? '4px solid #00f0ff' : '4px solid #00ff00' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{app.job.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>You were invited by {app.job.employer.companyName}!</p>
                  </div>
                  {app.status === 'INVITED' ? (
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button className="btn-primary" style={{ padding: '8px 16px' }} onClick={() => respondToInvitation(app.id, true)}>Accept</button>
                      <button className="btn-primary" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d' }} onClick={() => respondToInvitation(app.id, false)}>Decline</button>
                    </div>
                  ) : (
                    <span style={{ color: '#00ff00', fontWeight: 'bold' }}>Accepted! 🎉</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'MESSAGES' && (
            <div style={{ display: 'flex', gap: '2rem', height: '600px' }}>
              <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                <h3 style={{marginTop:0}}>Inbox</h3>
                {inbox.map(thread => (
                  <div key={thread.otherUserId} onClick={() => fetchChat(thread.otherUserId)} style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', background: selectedChat === thread.otherUserId ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
                    <strong>{thread.otherUser?.employer?.companyName || 'Employer'}</strong>
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
          {activeTab === 'ALERTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {notifications.length === 0 ? <p>No match alerts at this time.</p> : notifications.map(notif => (
                <div key={notif.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #00f0ff' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{notif.message}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                      Match Probability: <strong style={{ color: '#00f0ff' }}>{notif.matchProbability}%</strong>
                    </p>
                  </div>
                  {notif.jobId ? (
                    <div style={{ display: 'flex', gap: '1rem', marginLeft: '1rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)' }} 
                        onClick={() => {
                          setConsentJobId(notif.jobId);
                          setConsentNotificationId(notif.id);
                          const titleMatch = notif.message.match(/for (.*) at/);
                          setConsentJobTitle(titleMatch ? titleMatch[1] : 'Matched Job');
                        }}
                      >
                        Apply with Consent
                      </button>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)' }}
                        onClick={() => dismissAlert(notif.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-secondary)' }}
                      onClick={() => dismissAlert(notif.id)}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {consentJobId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: '#00f0ff', marginTop: 0 }}>Review & Consent</h2>
            <p style={{ margin: '1.5rem 0', color: 'white', lineHeight: '1.6' }}>
              You are consenting to apply for the job <strong>{consentJobTitle}</strong>. 
              The application will be sent automatically with your profile details.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button 
                className="btn-primary" 
                onClick={() => {
                  const notif = notifications.find(n => n.id === consentNotificationId);
                  if (notif) applyWithConsent(notif);
                }}
              >
                Yes, Consent & Apply
              </button>
              <button 
                className="btn-primary" 
                style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d' }}
                onClick={() => {
                  setConsentJobId(null);
                  setConsentNotificationId(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
