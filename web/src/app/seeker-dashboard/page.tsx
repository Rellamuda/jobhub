'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SeekerDashboard() {
  const [activeTab, setActiveTab] = useState<'APPLIED' | 'INVITATIONS' | 'MESSAGES' | 'ALERTS' | 'AUTONOMOUS'>('APPLIED');
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

  // Invitation Reply Modal state
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [replyEmployer, setReplyEmployer] = useState<{ userId: string; companyName: string; jobTitle: string } | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Autonomous Agent state
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [autoApplyKeywords, setAutoApplyKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [autoAppliedCount, setAutoAppliedCount] = useState(0);
  const [runningAutonomous, setRunningAutonomous] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

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
        if (profRes.ok) {
          const p = await profRes.json();
          setProfile(p);
          setAutoApplyEnabled(!!p.autoApplyEnabled);
          setAutoApplyKeywords(Array.isArray(p.autoApplyKeywords) ? p.autoApplyKeywords : (p.skills ? p.skills.slice(0, 5) : []));
        }

        const appRes = await fetch('/api/applications/my-applications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (appRes.ok) {
          const apps = await appRes.json();
          setApplications(apps);
          const autoCount = apps.filter((a: any) => a.coverLetter?.includes('Autonomous Agent')).length;
          setAutoAppliedCount(autoCount);
        }

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
    if (activeTab === 'AUTONOMOUS') fetchAutonomousStatus();
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

  const fetchAutonomousStatus = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/jobs/autonomous/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const status = await res.json();
        setAutoApplyEnabled(status.autoApplyEnabled);
        if (Array.isArray(status.autoApplyKeywords)) setAutoApplyKeywords(status.autoApplyKeywords);
        setAutoAppliedCount(status.totalAutoApplied ?? 0);
      }
    } catch (err) { console.error(err); }
  };

  const handleToggleAutoApply = async () => {
    const token = localStorage.getItem('token');
    const newEnabled = !autoApplyEnabled;
    setAutoApplyEnabled(newEnabled);
    try {
      setSavingSettings(true);
      await fetch('/api/jobs/autonomous/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: newEnabled, keywords: autoApplyKeywords })
      });
    } catch (err) { console.error(err); }
    finally { setSavingSettings(false); }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    const kw = keywordInput.trim();
    if (!autoApplyKeywords.includes(kw)) {
      const updated = [...autoApplyKeywords, kw];
      setAutoApplyKeywords(updated);
      saveKeywords(updated);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kwToRemove: string) => {
    const updated = autoApplyKeywords.filter(k => k !== kwToRemove);
    setAutoApplyKeywords(updated);
    saveKeywords(updated);
  };

  const saveKeywords = async (kws: string[]) => {
    const token = localStorage.getItem('token');
    try {
      await fetch('/api/jobs/autonomous/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ enabled: autoApplyEnabled, keywords: kws })
      });
    } catch (err) { console.error(err); }
  };

  const triggerAutonomousRun = async () => {
    const token = localStorage.getItem('token');
    setRunningAutonomous(true);
    try {
      const res = await fetch('/api/jobs/autonomous/run', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        alert(data.message || `Autonomous agent applied to matching jobs!`);
        // Refresh applications
        const appRes = await fetch('/api/applications/my-applications', { headers: { 'Authorization': `Bearer ${token}` } });
        if (appRes.ok) setApplications(await appRes.json());
        fetchAutonomousStatus();
      } else {
        alert(data.message || 'Error running autonomous agent');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to trigger autonomous matching');
    } finally {
      setRunningAutonomous(false);
    }
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

  // Open modal to reply directly to an employer invitation
  const openReplyModal = (app: any) => {
    const employerUserId = app.job?.employer?.userId;
    const companyName = app.job?.employer?.companyName || 'Employer';
    const jobTitle = app.job?.title || 'Job Invitation';
    
    setReplyEmployer({
      userId: employerUserId,
      companyName,
      jobTitle,
    });
    setReplyText(`Thank you for considering me for the ${jobTitle} position! I am very interested and would love to connect.`);
    setReplyModalOpen(true);
  };

  const sendInvitationReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyEmployer || !replyText.trim()) return;

    if (!replyEmployer.userId) {
      alert('Employer contact details are currently unavailable for this invite.');
      return;
    }

    setSendingReply(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ receiverId: replyEmployer.userId, content: replyText })
      });

      if (res.ok) {
        alert(`Reply sent to ${replyEmployer.companyName}! You can continue the conversation in the Messages tab.`);
        setReplyModalOpen(false);
        setReplyText('');
        // Pre-select and go to messages tab
        setSelectedChat(replyEmployer.userId);
        setActiveTab('MESSAGES');
        fetchChat(replyEmployer.userId);
      } else {
        const err = await res.json();
        alert(err.message || 'Failed to send reply');
      }
    } catch (err: any) {
      alert(err.message || 'Error sending message');
    } finally {
      setSendingReply(false);
    }
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
    <main style={{ padding: '2rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      
      {/* Centered Profile Section */}
      {profile && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2.5rem', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', marginBottom: '1rem', border: '2px solid rgba(0, 240, 255, 0.4)' }}>
            {profile.profilePicture ? (
              <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>👤</div>
            )}
          </div>
          <h2 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>{profile.firstName} {profile.lastName}</h2>
          <p style={{ margin: '4px 0 1rem 0', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>{profile.profession || 'Job Seeker'}</p>
          
          <button className="btn-primary" onClick={fetchAiInsights} disabled={aiLoading} style={{ background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', boxShadow: 'none' }}>
            {aiLoading ? 'Generating AI Insights...' : '✨ Generate AI Career Insights'}
          </button>

          {aiInsights && (
            <div className="glass-panel" style={{ marginTop: '2rem', padding: '1.5rem', textAlign: 'left', width: '100%', maxWidth: '650px', borderLeft: '4px solid #00f0ff' }}>
              <h3 style={{ marginTop: 0, color: '#00f0ff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✨ AI Career Insights</h3>
              
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Estimated Market Salary</h4>
                  <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#00f0ff' }}>{aiInsights.salary?.currency} {aiInsights.salary?.min?.toLocaleString()} - {aiInsights.salary?.max?.toLocaleString()}</p>
                  <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{aiInsights.salary?.reasoning}</p>
                </div>
                
                {aiInsights.score && (
                  <div style={{ flex: 1, minWidth: '250px', background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Resume Score</h4>
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
                <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>Career Path Suggestions</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {aiInsights.suggestions?.map((sug: string, i: number) => (
                    <span key={i} style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', padding: '4px 10px', borderRadius: '16px', fontSize: '0.85rem' }}>
                      {sug}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ fontSize: '2.4rem', margin: 0 }} className="text-gradient">Job Seeker Dashboard</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/dashboard/resumes/builder">
            <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', color: '#000', fontWeight: 'bold' }}>
              ✨ AI Resume Builder
            </button>
          </Link>
          <Link href="/jobs">
            <button className="btn-outline" style={{ border: '1px solid var(--secondary-color)' }}>Back to Job Board</button>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.8rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('APPLIED')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'APPLIED' ? '#00f0ff' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: activeTab === 'APPLIED' ? 'bold' : 'normal', padding: '0 4px', whiteSpace: 'nowrap' }}
        >
          Applied Jobs ({regularApps.length})
        </button>

        <button 
          onClick={() => setActiveTab('INVITATIONS')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'INVITATIONS' ? '#00f0ff' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: activeTab === 'INVITATIONS' ? 'bold' : 'normal', padding: '0 4px', whiteSpace: 'nowrap' }}
        >
          Invitations & Offers ({invitations.length})
        </button>

        <button 
          onClick={() => setActiveTab('AUTONOMOUS')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'AUTONOMOUS' ? '#00f0ff' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: activeTab === 'AUTONOMOUS' ? 'bold' : 'normal', padding: '0 4px', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
        >
          🤖 Autonomous Agent
          {autoApplyEnabled && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#00ff88', display: 'inline-block' }} />}
        </button>

        <button 
          onClick={() => setActiveTab('MESSAGES')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'MESSAGES' ? '#00f0ff' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: activeTab === 'MESSAGES' ? 'bold' : 'normal', padding: '0 4px', whiteSpace: 'nowrap' }}
        >
          Messages
        </button>

        <button 
          onClick={() => setActiveTab('ALERTS')} 
          style={{ background: 'none', border: 'none', color: activeTab === 'ALERTS' ? '#00f0ff' : 'var(--text-secondary)', fontSize: '1.1rem', cursor: 'pointer', fontWeight: activeTab === 'ALERTS' ? 'bold' : 'normal', position: 'relative', padding: '0 4px', whiteSpace: 'nowrap' }}
        >
          Match Alerts
          {notifications.length > 0 && (
            <span style={{ position: 'absolute', top: '-5px', right: '-15px', background: '#ff4d4d', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '50%' }}>
              {notifications.length}
            </span>
          )}
        </button>
      </div>

      {loading ? <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p> : (
        <>
          {/* APPLIED JOBS TAB */}
          {activeTab === 'APPLIED' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {regularApps.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No job applications submitted yet.</p>
                  <Link href="/jobs">
                    <button className="btn-primary" style={{ marginTop: '1rem' }}>Explore Open Roles</button>
                  </Link>
                </div>
              ) : regularApps.map(app => {
                const isAuto = app.coverLetter?.includes('Autonomous Agent');
                return (
                  <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: isAuto ? '4px solid #00f0ff' : '4px solid var(--border-color)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, color: 'var(--text-primary)' }}>{app.job.title}</h2>
                        {isAuto && (
                          <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            🤖 Auto-Applied by AI
                          </span>
                        )}
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>{app.job.employer?.companyName}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{ padding: '6px 16px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)', fontSize: '0.85rem', fontWeight: 'bold' }}>
                        {app.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* INVITATIONS & OFFERS TAB */}
          {activeTab === 'INVITATIONS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {invitations.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No interview invitations or offers yet.</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Keep your profile complete and active to receive employer invitations.</p>
                </div>
              ) : invitations.map(app => (
                <div key={app.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: app.status === 'INVITED' ? '4px solid #00f0ff' : '4px solid #00ff00' }}>
                  <div>
                    <h2 style={{ fontSize: '1.25rem', margin: 0, color: 'var(--text-primary)' }}>{app.job.title}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '4px 0' }}>
                      You were invited by <strong style={{ color: 'var(--text-primary)' }}>{app.job.employer?.companyName}</strong>!
                    </p>
                    {app.interviewDate && (
                      <p style={{ margin: '6px 0 0 0', color: '#00f0ff', fontSize: '0.9rem' }}>
                        📅 Scheduled: {new Date(app.interviewDate).toLocaleString()}
                        {app.interviewLink && <span style={{ marginLeft: 8 }}>🔗 <a href={app.interviewLink} target="_blank" rel="noreferrer" style={{ color: '#00f0ff', textDecoration: 'underline' }}>Join Link</a></span>}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Item 9: Message Employer / Reply button */}
                    <button 
                      onClick={() => openReplyModal(app)} 
                      className="btn-primary" 
                      style={{ padding: '8px 16px', background: 'rgba(0, 240, 255, 0.15)', border: '1px solid #00f0ff', color: '#00f0ff', fontSize: '0.9rem' }}
                    >
                      💬 Message Employer
                    </button>

                    {app.status === 'INVITED' ? (
                      <>
                        <button className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }} onClick={() => respondToInvitation(app.id, true)}>Accept</button>
                        <button className="btn-primary" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', fontSize: '0.9rem' }} onClick={() => respondToInvitation(app.id, false)}>Decline</button>
                      </>
                    ) : (
                      <span style={{ color: '#00ff88', fontWeight: 'bold' }}>Accepted! 🎉</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ITEM 10: AUTONOMOUS AGENT TAB */}
          {activeTab === 'AUTONOMOUS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div className="glass-panel" style={{ padding: '2rem', borderLeft: '4px solid #00f0ff' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      🤖 Autonomous AI Job Application Agent
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '6px 0 0 0', maxWidth: '650px' }}>
                      When enabled, JobHub AI automatically scans all newly posted jobs matching your target keywords and applies on your behalf 24/7 with a personalized cover letter.
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button 
                      onClick={handleToggleAutoApply}
                      style={{
                        padding: '10px 20px',
                        borderRadius: '30px',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        background: autoApplyEnabled ? 'linear-gradient(135deg, #00ff88 0%, #00aa55 100%)' : 'rgba(255,255,255,0.15)',
                        color: autoApplyEnabled ? '#000' : 'var(--text-primary)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {autoApplyEnabled ? '✅ Agent Active' : '⚪ Agent Paused (Click to Enable)'}
                    </button>
                  </div>
                </div>

                <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />

                {/* Target keywords manager */}
                <div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-primary)', fontSize: '1.1rem' }}>Target Roles & Keywords</h3>
                  <p style={{ margin: '0 0 1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    The AI matches job titles and descriptions against these keywords.
                  </p>

                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddKeyword(); } }}
                      placeholder="Add keyword (e.g. React, Fullstack, Python, AWS)..."
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.06)',
                        color: 'var(--text-primary)',
                        minWidth: '280px',
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={handleAddKeyword}
                      className="btn-primary" 
                      style={{ padding: '0 18px', fontSize: '0.9rem' }}
                    >
                      + Add
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {autoApplyKeywords.map(kw => (
                      <span key={kw} style={{ background: 'rgba(0, 240, 255, 0.12)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.3)', padding: '5px 12px', borderRadius: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {kw}
                        <button onClick={() => handleRemoveKeyword(kw)} style={{ background: 'none', border: 'none', color: '#00f0ff', cursor: 'pointer', padding: 0, fontWeight: 'bold' }}>×</button>
                      </span>
                    ))}
                    {autoApplyKeywords.length === 0 && (
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No keywords set. Add your desired roles above!</span>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button 
                    onClick={triggerAutonomousRun}
                    disabled={runningAutonomous}
                    className="btn-primary" 
                    style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', color: '#000', fontWeight: 'bold' }}
                  >
                    {runningAutonomous ? '🤖 Scanning & Applying...' : '🚀 Run Auto-Apply Now'}
                  </button>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Total jobs applied by AI: <strong style={{ color: '#00f0ff' }}>{autoAppliedCount}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* MESSAGES TAB */}
          {activeTab === 'MESSAGES' && (
            <div style={{ display: 'flex', gap: '1.5rem', height: '600px', flexWrap: 'wrap' }}>
              <div className="glass-panel" style={{ flex: 1, minWidth: '260px', overflowY: 'auto', padding: '1rem' }}>
                <h3 style={{ marginTop: 0, color: 'var(--text-primary)' }}>Inbox</h3>
                {inbox.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No message conversations yet.</p>
                ) : inbox.map(thread => (
                  <div 
                    key={thread.otherUserId} 
                    onClick={() => fetchChat(thread.otherUserId)} 
                    style={{ 
                      padding: '1rem', 
                      borderRadius: '8px', 
                      marginBottom: '0.5rem', 
                      cursor: 'pointer', 
                      background: selectedChat === thread.otherUserId ? 'rgba(0, 240, 255, 0.15)' : 'rgba(255,255,255,0.04)',
                      border: selectedChat === thread.otherUserId ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.06)'
                    }}
                  >
                    <strong style={{ color: 'var(--text-primary)' }}>{thread.otherUser?.employer?.companyName || thread.otherUser?.jobSeekerProfile?.firstName || 'Employer'}</strong>
                    <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {thread.latestMessage.content.substring(0, 45)}...
                    </p>
                  </div>
                ))}
              </div>
              
              <div className="glass-panel" style={{ flex: 2, minWidth: '320px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                {selectedChat ? (
                  <>
                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                      {chatMessages.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>No messages yet. Send a message below!</p>
                      ) : chatMessages.map(msg => {
                        const isFromMe = msg.senderId !== selectedChat;
                        return (
                          <div 
                            key={msg.id} 
                            style={{ 
                              alignSelf: isFromMe ? 'flex-end' : 'flex-start', 
                              background: isFromMe ? 'linear-gradient(135deg, #0080ff 0%, #0050cc 100%)' : 'rgba(255,255,255,0.1)', 
                              color: '#fff',
                              padding: '10px 16px', 
                              borderRadius: '16px',
                              maxWidth: '75%',
                              wordBreak: 'break-word',
                            }}
                          >
                            {msg.content}
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px', textAlign: 'right' }}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input 
                        type="text" 
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
                        style={{ flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)' }} 
                        placeholder="Type a message to employer..." 
                      />
                      <button onClick={sendMessage} className="btn-primary" style={{ padding: '0 24px' }}>Send</button>
                    </div>
                  </>
                ) : (
                  <div style={{ textAlign: 'center', marginTop: '6rem', color: 'var(--text-secondary)' }}>
                    <p style={{ fontSize: '1.1rem' }}>Select a conversation from the left to start messaging.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ALERTS TAB */}
          {activeTab === 'ALERTS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {notifications.length === 0 ? <p style={{ color: 'var(--text-secondary)' }}>No match alerts at this time.</p> : notifications.map(notif => (
                <div key={notif.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderLeft: '4px solid #00f0ff' }}>
                  <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>{notif.message}</h2>
                    {notif.matchProbability && (
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0 0', fontSize: '0.9rem' }}>
                        Match Probability: <strong style={{ color: '#00f0ff' }}>{notif.matchProbability}%</strong>
                      </p>
                    )}
                  </div>
                  {notif.jobId ? (
                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', color: '#000', fontWeight: 'bold' }} 
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
                        className="btn-outline" 
                        style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)' }}
                        onClick={() => dismissAlert(notif.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  ) : (
                    <button 
                      className="btn-outline" 
                      style={{ padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)' }}
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

      {/* Item 9: Reply to Invitation Modal */}
      {replyModalOpen && replyEmployer && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '1rem',
        }}>
          <div className="glass-panel" style={{ padding: '2rem', maxWidth: '520px', width: '100%', borderRadius: '16px' }}>
            <h2 style={{ color: '#00f0ff', marginTop: 0, marginBottom: '0.5rem' }}>
              💬 Reply to {replyEmployer.companyName}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.2rem' }}>
              Regarding invitation for: <strong style={{ color: 'var(--text-primary)' }}>{replyEmployer.jobTitle}</strong>
            </p>
            <form onSubmit={sendInvitationReply}>
              <textarea 
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={4}
                required
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'var(--text-primary)',
                  fontSize: '0.95rem',
                  resize: 'vertical',
                  boxSizing: 'border-box',
                }}
                placeholder="Type your message to the hiring manager..."
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  onClick={() => setReplyModalOpen(false)}
                  className="btn-outline"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={sendingReply}
                  className="btn-primary"
                  style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', color: '#000', fontWeight: 'bold' }}
                >
                  {sendingReply ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review & Consent Modal */}
      {consentJobId && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '500px', textAlign: 'center' }}>
            <h2 style={{ color: '#00f0ff', marginTop: 0 }}>Review & Consent</h2>
            <p style={{ margin: '1.5rem 0', color: 'var(--text-primary)', lineHeight: '1.6' }}>
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
