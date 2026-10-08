'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function JobsFeedPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingJobId, setApplyingJobId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
  const [matchScores, setMatchScores] = useState<Record<string, {score?: number, loading: boolean}>>({});
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  const [role, setRole] = useState<'JOB_SEEKER' | 'EMPLOYER' | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<'FREE' | 'PREMIUM'>('FREE');
  const [freeGenerationsUsed, setFreeGenerationsUsed] = useState(0);

  useEffect(() => {
    // Guard: check if user has a completed profile before allowing access to jobs
    const checkProfileAndFetch = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const authRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (authRes.ok) {
          const user = await authRes.json();
          setRole(user.role);
          setSubscriptionTier(user.subscriptionTier);
          setFreeGenerationsUsed(user.freeGenerationsUsed);
          
          // Verify profile exists
          const endpoint = user.role === 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
          const profileRes = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (!profileRes.ok) {
            window.location.href = '/profile';
            return;
          }
          const profile = await profileRes.json();
          if (user.role === 'JOB_SEEKER' && (!profile.firstName || profile.firstName.length === 0)) {
            window.location.href = '/profile';
            return;
          } else if (user.role === 'EMPLOYER' && (!profile.companyName || profile.companyName.length === 0)) {
            window.location.href = '/profile';
            return;
          }

          if (user.role === 'JOB_SEEKER') {
            fetch('/api/resumes', { headers: { 'Authorization': `Bearer ${token}` } })
              .then(res => res.json())
              .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                  setResumes(data);
                  setSelectedResumeId(data[0].id);
                }
              })
              .catch(console.error);
          }
        } else {
          window.location.href = '/profile';
          return;
        }
      } catch (err) {
        window.location.href = '/profile';
        return;
      }

      fetchJobs();
    };
    checkProfileAndFetch();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/jobs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId: string) => {
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in to apply for a job.');
      }

      const res = await fetch(`/api/applications/${jobId}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          coverLetter: coverLetter || undefined,
          resumeId: selectedResumeId || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Application failed');
      }

      setSuccess('Application submitted successfully with your attached resume and cover letter!');
      setApplyingJobId(null);
      setCoverLetter('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleGenerateCoverLetter = async (job: any) => {
    setGeneratingCoverLetter(true);
    try {
      const token = localStorage.getItem('token');
      // Fetch user profile first (we need it for the AI)
      const profileRes = await fetch('/api/profiles/job-seeker', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();

      const res = await fetch('/api/ai/cover-letter/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile: profileData,
          job: job
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCoverLetter(data.cover_letter);
        if (subscriptionTier === 'FREE') {
          setFreeGenerationsUsed(prev => prev + 1);
        }
      } else {
        setError(data.message || 'Failed to generate cover letter.');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to generate cover letter.');
    } finally {
      setGeneratingCoverLetter(false);
    }
  };

  const calculateMatchScore = async (job: any) => {
    setMatchScores(prev => ({ ...prev, [job.id]: { loading: true } }));
    try {
      const token = localStorage.getItem('token');
      const profileRes = await fetch('/api/profiles/job-seeker', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const profileData = await profileRes.json();
      const profileText = JSON.stringify(profileData);

      const res = await fetch('/api/ai/match/score', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          profile_text: profileText,
          job_description_text: job.description || job.title
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setMatchScores(prev => ({ ...prev, [job.id]: { loading: false, score: data.match_score } }));
      } else {
        setMatchScores(prev => ({ ...prev, [job.id]: { loading: false } }));
      }
    } catch (err) {
      setMatchScores(prev => ({ ...prev, [job.id]: { loading: false } }));
    }
  };

  const filteredJobs = jobs.filter(j => 
    j.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (j.employer?.companyName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main style={{ padding: '4rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '3rem', margin: 0 }} className="text-gradient">Job Board</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/profile">
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--secondary-color)', boxShadow: 'none' }}>Profile</button>
          </Link>
          {role === 'JOB_SEEKER' && (
            <Link href="/seeker-dashboard">
              <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', boxShadow: 'none' }}>Dashboard</button>
            </Link>
          )}
          {role === 'EMPLOYER' && (
            <>
              <Link href="/applications">
                <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #ffd700', color: '#ffd700', boxShadow: 'none' }}>Applications</button>
              </Link>
            </>
          )}
          <button 
            className="btn-primary" 
            style={{ background: 'transparent', border: '1px solid #ff4d4d', color: '#ff4d4d', boxShadow: 'none' }}
            onClick={() => {
              localStorage.removeItem('token');
              window.location.href = '/login';
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '3rem' }}>
        <input 
          type="text" 
          placeholder="Search jobs by title, company, or keyword..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '20px',
            borderRadius: '16px',
            border: '1px solid var(--glass-border)',
            background: 'var(--glass-bg)',
            color: 'white',
            fontSize: '1.2rem',
            outline: 'none',
            boxShadow: 'var(--glass-shadow)',
          }}
        />
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4d4d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ backgroundColor: 'rgba(0, 255, 0, 0.1)', border: '1px solid green', color: '#00ff00', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
          {success}
        </div>
      )}

      {loading ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Loading jobs...</p>
      ) : filteredJobs.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No jobs found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {filteredJobs.map(job => (
            <div key={job.id} className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: '0 0 0.5rem 0' }}>{job.title}</h2>
                  <div style={{ display: 'flex', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                      🏢 <Link href={`/company/${job.employerId}`} style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 600 }}>{job.employer?.companyName || 'Unknown Company'}</Link>
                      {job.employer?.verificationStatus === 'VERIFIED' && (
                        <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.4)', borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          ✔ Verified Company
                        </span>
                      )}
                    </span>
                    <span>📍 {job.location || 'Anywhere'} {job.isRemote && '(Remote)'}</span>
                    <span>💰 {job.salary || 'Competitive'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {role === 'JOB_SEEKER' && (
                    <>
                      {matchScores[job.id]?.score !== undefined ? (
                        <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '6px 12px', borderRadius: '12px', color: '#00f0ff', fontWeight: 'bold' }}>
                          {matchScores[job.id]!.score!}% Match
                        </div>
                      ) : (
                        <button 
                          onClick={() => calculateMatchScore(job)}
                          disabled={matchScores[job.id]?.loading}
                          style={{ background: 'transparent', border: '1px solid var(--secondary-color)', color: 'var(--text-secondary)', padding: '6px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}
                        >
                          {matchScores[job.id]?.loading ? 'Calculating...' : 'Predict Match Score'}
                        </button>
                      )}
                      <button 
                        className="btn-primary" 
                        style={{ padding: '8px 24px' }}
                        onClick={() => setApplyingJobId(applyingJobId === job.id ? null : job.id)}
                      >
                        {applyingJobId === job.id ? 'Cancel' : 'Apply Now'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Application Section with Attached Resume & Cover Letter */}
              {applyingJobId === job.id && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                  <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#00f0ff' }}>Complete Job Application</h3>
                  
                  {/* Resume Selection */}
                  <div style={{ marginBottom: '1.2rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'white', marginBottom: '0.4rem', fontWeight: 600 }}>
                      📄 Attached Resume:
                    </label>
                    {resumes.length > 0 ? (
                      <select 
                        value={selectedResumeId} 
                        onChange={(e) => setSelectedResumeId(e.target.value)}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', color: 'white', border: '1px solid rgba(255,255,255,0.2)' }}
                      >
                        {resumes.map(r => (
                          <option key={r.id} value={r.id} style={{ background: '#120B1C', color: 'white' }}>
                            {r.title || 'Saved Resume'} (Updated {new Date(r.updatedAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: '#a1a1aa', fontSize: '0.85rem' }}>
                        Default: Your complete verified onboarding credentials will be attached as your active resume.{' '}
                        <Link href="/dashboard/resumes/builder" style={{ color: '#00f0ff', textDecoration: 'underline' }}>Build Custom Resume</Link>
                      </div>
                    )}
                  </div>

                  {/* Cover Letter */}
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.9rem', color: 'white', marginBottom: '0.4rem', fontWeight: 600 }}>
                      ✉️ Cover Letter (Optional or AI-Generated):
                    </label>
                    {subscriptionTier === 'FREE' && freeGenerationsUsed >= 1 && (
                      <div style={{ color: '#ff8c00', marginBottom: '0.5rem', fontSize: '0.85rem' }}>⚠️ Free generation limit reached. You can type manually or upgrade for unlimited AI generations.</div>
                    )}
                    <textarea 
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      rows={4}
                      placeholder="Write your cover letter or click 'Generate AI Cover Letter' below..."
                      style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleGenerateCoverLetter(job)}
                      disabled={generatingCoverLetter || (subscriptionTier === 'FREE' && freeGenerationsUsed >= 1)}
                      style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', padding: '8px 16px', fontSize: '0.9rem' }}
                    >
                      {generatingCoverLetter ? 'Generating...' : '✨ Generate AI Cover Letter'}
                    </button>
                    <button 
                      className="btn-primary" 
                      onClick={() => handleApply(job.id)}
                      style={{ padding: '10px 24px', fontWeight: 'bold' }}
                    >
                      🚀 Submit Application with Resume
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
