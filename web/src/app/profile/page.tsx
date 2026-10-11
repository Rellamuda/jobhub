'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [completion, setCompletion] = useState<number>(0);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Autonomous Application State
  const [autoApplyEnabled, setAutoApplyEnabled] = useState(false);
  const [autonomousMode, setAutonomousMode] = useState<'FULL' | 'PARTIAL'>('PARTIAL');
  const [autoApplyKeywords, setAutoApplyKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState('');
  const [savingAutoApply, setSavingAutoApply] = useState(false);

  // Employer AI Profile Builder State
  const [aiCompanyLoading, setAiCompanyLoading] = useState(false);
  const [aiCompanySaved, setAiCompanySaved] = useState(false);
  const [companyBizType, setCompanyBizType] = useState('Company');
  const [companyAdditionalNotes, setCompanyAdditionalNotes] = useState('');
  const [generatedCompanyProfile, setGeneratedCompanyProfile] = useState<any>(null);

  // Employer Verification State
  const [empRegNumber, setEmpRegNumber] = useState('');
  const [empWebsite, setEmpWebsite] = useState('');
  const [empTaxId, setEmpTaxId] = useState('');
  const [empVerifying, setEmpVerifying] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }
      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          const endpoint = userData.role === 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
          const profRes = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profRes.ok) {
            const p = await profRes.json();
            setProfile(p);
            if (p.profilePicture) {
              localStorage.setItem('userProfilePic', p.profilePicture);
            }
            if (p.registrationNumber) setEmpRegNumber(p.registrationNumber);
            if (p.website) setEmpWebsite(p.website);
            if (p.taxId) setEmpTaxId(p.taxId);
            if (p.businessType) setCompanyBizType(p.businessType);
            setAutoApplyEnabled(!!p.autoApplyEnabled);
            setAutonomousMode(p.autonomousMode === 'FULL' ? 'FULL' : 'PARTIAL');
            setAutoApplyKeywords(p.autoApplyKeywords || []);
          }

          if (userData.role === 'JOB_SEEKER') {
            const compRes = await fetch('/api/profiles/job-seeker/completion', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (compRes.ok) {
              const compData = await compRes.json();
              setCompletion(compData.completion);
            }
            const appRes = await fetch('/api/applications/my-applications', {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (appRes.ok) {
              setApplications(await appRes.json());
            }
          }
        } else {
          router.push('/login');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleVerifyCompany = async () => {
    setEmpVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profiles/employer/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          registrationNumber: empRegNumber || profile?.registrationNumber,
          website: empWebsite || profile?.website,
          taxId: empTaxId || profile?.taxId,
        })
      });
      const data = await res.json();
      if (data.verified) {
        setProfile((prev: any) => ({ ...prev, ...data.employer, verificationStatus: 'VERIFIED' }));
        alert('🎉 ' + data.message);
      } else {
        alert('⚠️ ' + data.message);
      }
    } catch (e) {
      alert('Network error verifying company');
    } finally {
      setEmpVerifying(false);
    }
  };

  const handleRequestVerification = async () => {
    setVerifying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profiles/verify/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ docs: { type: 'ID_CARD' } })
      });
      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, verificationStatus: 'PENDING' }));
        alert('Verification requested successfully!');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setVerifying(false);
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }

    setUploadingPhoto(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/uploads/profile-picture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        setProfile((prev: any) => ({ ...prev, profilePicture: data.url }));
        localStorage.setItem('userProfilePic', data.url);
        alert('Profile picture updated successfully!');
      } else {
        alert('Failed to upload picture.');
      }
    } catch (err) {
      console.error(err);
      alert('Error uploading picture.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleAddKeyword = () => {
    if (!keywordInput.trim()) return;
    if (!autoApplyKeywords.includes(keywordInput.trim())) {
      setAutoApplyKeywords([...autoApplyKeywords, keywordInput.trim()]);
    }
    setKeywordInput('');
  };

  const handleRemoveKeyword = (kw: string) => {
    setAutoApplyKeywords(autoApplyKeywords.filter(k => k !== kw));
  };

  const handleSaveAutoApply = async () => {
    setSavingAutoApply(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profiles/job-seeker/auto-apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          autoApplyEnabled,
          autoApplyKeywords,
          enabled: autoApplyEnabled,
          keywords: autoApplyKeywords,
          autonomousMode,
          mode: autonomousMode
        })
      });

      // Also sync to autonomous service
      await fetch('/api/jobs/autonomous/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          enabled: autoApplyEnabled,
          keywords: autoApplyKeywords,
          autonomousMode
        })
      }).catch(() => {});

      if (res.ok) {
        alert('Autonomous application preferences saved successfully!');
      } else {
        alert('Failed to save preferences.');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving preferences.');
    } finally {
      setSavingAutoApply(false);
    }
  };

  const handleGenerateAICompanyProfile = async () => {
    setAiCompanyLoading(true);
    setAiCompanySaved(false);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        companyName: profile?.companyName || 'My Organization',
        industry: profile?.industry || 'Technology & Business Solutions',
        businessType: companyBizType,
        locationCity: profile?.locationCity || 'Remote',
        locationCountry: profile?.locationCountry || 'Global',
        companySize: profile?.companySize || '50-200',
        website: empWebsite || profile?.website || '',
        additionalInfo: companyAdditionalNotes
      };
      const res = await fetch('/api/ai/company-profile/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setGeneratedCompanyProfile(data);
      } else {
        alert('Could not generate AI company profile right now.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI profile service.');
    } finally {
      setAiCompanyLoading(false);
    }
  };

  const handleSaveAICompanyProfile = async () => {
    if (!generatedCompanyProfile) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profiles/employer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          description: generatedCompanyProfile.description,
          mission: generatedCompanyProfile.mission,
          vision: generatedCompanyProfile.vision,
          coreValues: generatedCompanyProfile.coreValues,
          culture: generatedCompanyProfile.culture,
          whyWorkWithUs: generatedCompanyProfile.whyWorkWithUs,
          benefits: generatedCompanyProfile.benefits,
          businessType: generatedCompanyProfile.businessType || companyBizType,
          industry: generatedCompanyProfile.industry || profile?.industry,
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setProfile(updated);
        setAiCompanySaved(true);
        alert('✨ AI Company Profile saved to your dashboard successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save AI profile.');
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>Loading...</div>;
  if (!profile) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: '5rem' }}>
      <h2>Profile not found</h2>
      <Link href="/onboarding" className="btn-primary" style={{ padding: '0.5rem 1rem', textDecoration: 'none', marginTop: '1rem' }}>Complete Profile</Link>
    </div>
  );

  return (
    <main style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '2rem' }}>
      
      {/* Main Content Area */}
      <div style={{ flex: '2', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Hidden File Input for Avatar Upload */}
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleUploadPhoto} 
          accept="image/png,image/jpeg,image/jpg" 
          style={{ display: 'none' }} 
        />

        {/* Profile Header */}
        <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
          {profile.bannerImage && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: `url(${profile.bannerImage}) center/cover`, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', opacity: 0.5 }}></div>
          )}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: profile.bannerImage ? '60px' : '0' }}>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 140, height: 140, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.1)', border: '4px solid var(--primary-color)', position: 'relative' }}>
                  {profile.profilePicture ? (
                    <img src={profile.profilePicture} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>{user.role === 'EMPLOYER' ? '🏢' : '👤'}</div>
                  )}
                  {uploadingPhoto && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.8rem' }}>
                      Uploading...
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  style={{
                    fontSize: '0.8rem',
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid var(--primary-color)',
                    color: 'var(--text-primary)',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  {uploadingPhoto ? 'Uploading...' : '📷 Change Photo'}
                </button>
              </div>
              <div>
                {user.role === 'JOB_SEEKER' ? (
                  <>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {profile.firstName} {profile.lastName}
                      {profile.verificationStatus === 'VERIFIED' && <span title="Verified Professional" style={{ color: '#00f0ff', fontSize: '1.5rem' }}>✔</span>}
                    </h1>
                    <p style={{ fontSize: '1.2rem', margin: '0.5rem 0' }}>{profile.headline || profile.profession || 'Job Seeker'} {profile.isSkilledProfessional && `(${profile.skilledProfession})`}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{profile.residenceCity}{profile.residenceState && `, ${profile.residenceState}`} {profile.residenceCountry && `- ${profile.residenceCountry}`}</p>
                    
                    {profile.verificationStatus === 'UNVERIFIED' && (
                      <button 
                        onClick={handleRequestVerification} 
                        disabled={verifying}
                        style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        {verifying ? 'Requesting...' : 'Request Verification'}
                      </button>
                    )}
                    {profile.verificationStatus === 'PENDING' && (
                      <div style={{ marginTop: '0.5rem', color: '#ffd700', fontSize: '0.9rem' }}>Verification Pending...</div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
                      <div style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '0.2rem 0.8rem', borderRadius: '20px', color: '#00f0ff', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        ★★★★☆ Profile Strength ({completion}%)
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <h1 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {profile.companyName}
                      {profile.verificationStatus === 'VERIFIED' && <span title="Verified Company" style={{ color: '#00f0ff', fontSize: '1.5rem' }}>✔</span>}
                    </h1>
                    <p style={{ fontSize: '1.2rem', margin: '0.5rem 0', color: 'var(--secondary-color)' }}>{profile.industry || 'Employer'}</p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>{profile.locationCity}{profile.locationState && `, ${profile.locationState}`} {profile.locationCountry && `- ${profile.locationCountry}`}</p>

                    {profile.verificationStatus === 'UNVERIFIED' && (
                      <button 
                        onClick={handleRequestVerification} 
                        disabled={verifying}
                        style={{ marginTop: '0.5rem', background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}
                      >
                        {verifying ? 'Requesting...' : 'Request Verification'}
                      </button>
                    )}
                    {profile.verificationStatus === 'PENDING' && (
                      <div style={{ marginTop: '0.5rem', color: '#ffd700', fontSize: '0.9rem' }}>Verification Pending...</div>
                    )}
                  </>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <Link href="/onboarding" className="btn-primary" style={{ textDecoration: 'none', padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--primary-color)' }}>
                Edit Profile
              </Link>
              {user.role === 'JOB_SEEKER' && (
                <button className="btn-primary" style={{ padding: '0.5rem 1rem' }} onClick={() => window.print()}>Export PDF CV</button>
              )}
            </div>
          </div>
        </div>

        {user.role === 'JOB_SEEKER' ? (
          <>
            {/* About Me */}
            {(profile.summary || profile.bio) && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>About Me</h2>
                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{profile.summary || profile.bio}</p>
              </div>
            )}

            {/* Job Preferences */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Job Preferences</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>Desired Title:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.desiredJobTitle || 'Any'}</span></div>
                <div><strong>Employment Type:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.employmentType || 'Any'}</span></div>
                <div><strong>Work Arrangement:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.workArrangement || 'Any'}</span></div>
                <div><strong>Expected Salary:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.expectedSalary || 'Negotiable'}</span></div>
              </div>
            </div>

            {/* Autonomous Job Application Settings */}
            <div className="glass-panel" style={{ padding: '2rem', border: autoApplyEnabled ? '1px solid rgba(0, 255, 136, 0.3)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🤖 Autonomous Application Settings
                  </h2>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Control how the JobHub AI agent applies for high-match jobs on your behalf.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoApplyEnabled(!autoApplyEnabled)}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '20px',
                    border: 'none',
                    fontWeight: 'bold',
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    background: autoApplyEnabled ? 'linear-gradient(135deg, #00ff88 0%, #00aa55 100%)' : 'rgba(255,255,255,0.15)',
                    color: autoApplyEnabled ? '#000' : 'white',
                  }}
                >
                  {autoApplyEnabled ? '✅ Auto-Apply Active' : '⚪ Auto-Apply Paused'}
                </button>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, color: 'white', marginBottom: '0.6rem' }}>
                  Application Execution Preference:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
                  <div
                    onClick={() => setAutonomousMode('FULL')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: autonomousMode === 'FULL' ? '2px solid #00ff88' : '1px solid rgba(255,255,255,0.1)',
                      background: autonomousMode === 'FULL' ? 'rgba(0, 255, 136, 0.1)' : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: autonomousMode === 'FULL' ? '#00ff88' : 'white', fontSize: '0.95rem' }}>
                      <span>{autonomousMode === 'FULL' ? '⚡' : '⚪'}</span>
                      <span>Full Autonomous Application</span>
                    </div>
                    <p style={{ margin: '0.4rem 0 0 1.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Directly submits applications without notification or prior consent requests as soon as high-match roles appear.
                    </p>
                  </div>

                  <div
                    onClick={() => setAutonomousMode('PARTIAL')}
                    style={{
                      padding: '1rem',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      border: autonomousMode === 'PARTIAL' ? '2px solid #00f0ff' : '1px solid rgba(255,255,255,0.1)',
                      background: autonomousMode === 'PARTIAL' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 'bold', color: autonomousMode === 'PARTIAL' ? '#00f0ff' : 'white', fontSize: '0.95rem' }}>
                      <span>{autonomousMode === 'PARTIAL' ? '🛡️' : '⚪'}</span>
                      <span>Partial Autonomous Application</span>
                    </div>
                    <p style={{ margin: '0.4rem 0 0 1.6rem', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                      Sends a notification to seek your consent first so you can review each role before the system submits your application.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={handleSaveAutoApply}
                  disabled={savingAutoApply}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                >
                  {savingAutoApply ? 'Saving Preferences...' : 'Save Autonomous Preferences'}
                </button>
              </div>
            </div>



            {/* Experience */}
            {profile.experience && profile.experience.length > 0 && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Experience</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {profile.experience.map((ex: any, idx: number) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '4px solid var(--primary-color)' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{ex.role}</h3>
                      <p style={{ margin: '0.2rem 0', color: 'var(--secondary-color)', fontWeight: 'bold' }}>{ex.company}</p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{ex.dates}</p>
                      {ex.responsibilities && <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{ex.responsibilities}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {profile.education && profile.education.length > 0 && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Education</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {profile.education.map((ed: any, idx: number) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                      <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{ed.school}</h3>
                      <p style={{ margin: '0.2rem 0', color: 'var(--secondary-color)' }}>{ed.course}</p>
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{ed.dates || `Graduated: ${ed.yearGraduated}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Projects */}
            {profile.projects && profile.projects.length > 0 && (
              <div className="glass-panel" style={{ padding: '2rem' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Projects</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  {profile.projects.map((proj: any, idx: number) => (
                    <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{proj.title}</h3>
                      <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{proj.description}</p>
                      {proj.liveLink && <a href={proj.liveLink} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)', fontSize: '0.9rem' }}>View Project ↗</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Company Verification Card */}
            <div className="glass-panel" style={{ padding: '2rem', border: profile.verificationStatus === 'VERIFIED' ? '1px solid rgba(0, 240, 255, 0.4)' : '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>
                  Company Verification & Trust Badge
                </h2>
                {profile.verificationStatus === 'VERIFIED' ? (
                  <span style={{ background: 'rgba(0, 240, 255, 0.15)', color: '#00f0ff', border: '1px solid rgba(0, 240, 255, 0.5)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    ✔ Verified Company Badge Active
                  </span>
                ) : (
                  <span style={{ background: 'rgba(255, 165, 0, 0.15)', color: '#ffa500', border: '1px solid rgba(255, 165, 0, 0.5)', borderRadius: '20px', padding: '4px 14px', fontSize: '0.85rem', fontWeight: 'bold' }}>
                    ⏳ Unverified Organization
                  </span>
                )}
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>
                Verify your organization's legal registration and active internet presence to receive the verified company trust badge on all job postings.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'white', marginBottom: '0.3rem', fontWeight: 600 }}>Registration Number (RC / EIN / CRN):</label>
                  <input 
                    type="text" 
                    value={empRegNumber} 
                    onChange={e => setEmpRegNumber(e.target.value)} 
                    placeholder="e.g. RC-1049283 or EIN-987654" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'white', marginBottom: '0.3rem', fontWeight: 600 }}>Active Website / Internet Presence:</label>
                  <input 
                    type="text" 
                    value={empWebsite} 
                    onChange={e => setEmpWebsite(e.target.value)} 
                    placeholder="e.g. https://www.yourcompany.com" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'white', marginBottom: '0.3rem', fontWeight: 600 }}>Tax ID / VAT (Optional):</label>
                  <input 
                    type="text" 
                    value={empTaxId} 
                    onChange={e => setEmpTaxId(e.target.value)} 
                    placeholder="e.g. TAX-49201" 
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }} 
                  />
                </div>
              </div>

              <button 
                type="button" 
                onClick={handleVerifyCompany} 
                disabled={empVerifying} 
                className="btn-primary" 
                style={{ padding: '10px 24px', fontWeight: 'bold', background: profile.verificationStatus === 'VERIFIED' ? 'rgba(0, 240, 255, 0.2)' : undefined }}
              >
                {empVerifying ? 'Verifying Credentials & Web Presence...' : (profile.verificationStatus === 'VERIFIED' ? 'Re-verify / Update Credentials' : 'Verify Company & Issue Badge')}
              </button>
            </div>

            {/* AI Company or Agency Profile Builder Card */}
            <div className="glass-panel" style={{ padding: '2rem', border: '1px solid rgba(0, 240, 255, 0.35)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(0, 240, 255, 0.05) 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    ✨ AI Company & Agency Profile Builder
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>
                    Generate an executive corporate or agency profile with mission, vision, culture, core values, and benefits using JobHub AI.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateAICompanyProfile}
                  disabled={aiCompanyLoading}
                  className="btn-primary"
                  style={{
                    padding: '10px 22px',
                    fontWeight: 'bold',
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #00f0ff 0%, #6366f1 100%)',
                    color: '#000',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  {aiCompanyLoading ? '🤖 Crafting AI Profile...' : '✨ Generate AI Profile'}
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'white', marginBottom: '0.3rem', fontWeight: 600 }}>Organization Type:</label>
                  <select
                    value={companyBizType}
                    onChange={(e) => setCompanyBizType(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--glass-border)', color: 'white' }}
                  >
                    <option value="Company">Direct Employer / Corporate Company</option>
                    <option value="Agency / Recruitment Agency">Recruitment Agency / Staffing Agency</option>
                    <option value="Tech Startup">Tech Startup</option>
                    <option value="Consultancy">Consultancy / Professional Advisory</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'white', marginBottom: '0.3rem', fontWeight: 600 }}>Key Strengths & Highlights (Optional):</label>
                  <input
                    type="text"
                    value={companyAdditionalNotes}
                    onChange={(e) => setCompanyAdditionalNotes(e.target.value)}
                    placeholder="e.g. Remote-first culture, fintech leader, high retention"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'white' }}
                  />
                </div>
              </div>

              {generatedCompanyProfile && (
                <div style={{ marginTop: '1.5rem', padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(0, 240, 255, 0.25)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#00f0ff' }}>
                      📋 Generated AI Profile Preview
                    </span>
                    <button
                      type="button"
                      onClick={handleSaveAICompanyProfile}
                      style={{
                        padding: '8px 20px',
                        borderRadius: '8px',
                        background: '#00ff88',
                        color: '#000',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      💾 Save AI Profile to Dashboard
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>Executive Description:</strong>
                      <textarea
                        value={generatedCompanyProfile.description}
                        onChange={(e) => setGeneratedCompanyProfile({ ...generatedCompanyProfile, description: e.target.value })}
                        rows={3}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <strong style={{ color: 'var(--primary-color)' }}>Mission Statement:</strong>
                        <textarea
                          value={generatedCompanyProfile.mission}
                          onChange={(e) => setGeneratedCompanyProfile({ ...generatedCompanyProfile, mission: e.target.value })}
                          rows={2}
                          style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                      <div>
                        <strong style={{ color: 'var(--primary-color)' }}>Vision Statement:</strong>
                        <textarea
                          value={generatedCompanyProfile.vision}
                          onChange={(e) => setGeneratedCompanyProfile({ ...generatedCompanyProfile, vision: e.target.value })}
                          rows={2}
                          style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                        />
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>Culture & Operating Principles:</strong>
                      <textarea
                        value={generatedCompanyProfile.culture}
                        onChange={(e) => setGeneratedCompanyProfile({ ...generatedCompanyProfile, culture: e.target.value })}
                        rows={2}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                    <div>
                      <strong style={{ color: 'var(--primary-color)' }}>Why Work With Us:</strong>
                      <textarea
                        value={generatedCompanyProfile.whyWorkWithUs}
                        onChange={(e) => setGeneratedCompanyProfile({ ...generatedCompanyProfile, whyWorkWithUs: e.target.value })}
                        rows={2}
                        style={{ width: '100%', marginTop: '4px', padding: '8px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                      />
                    </div>
                    {generatedCompanyProfile.benefits && Array.isArray(generatedCompanyProfile.benefits) && (
                      <div>
                        <strong style={{ color: 'var(--primary-color)' }}>Employee Perks & Benefits:</strong>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '6px' }}>
                          {generatedCompanyProfile.benefits.map((b: string, i: number) => (
                            <span key={i} style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
                              ✓ {b}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>About the Company</h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{profile.description || 'No description provided.'}</p>
              {profile.mission && (
                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                  <strong style={{ color: '#00f0ff' }}>Mission:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{profile.mission}</p>
                </div>
              )}
              {profile.vision && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ color: '#00f0ff' }}>Vision:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{profile.vision}</p>
                </div>
              )}
              {profile.culture && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ color: '#00f0ff' }}>Workplace Culture:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{profile.culture}</p>
                </div>
              )}
              {profile.whyWorkWithUs && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ color: '#00f0ff' }}>Why Work With Us:</strong>
                  <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{profile.whyWorkWithUs}</p>
                </div>
              )}
              {profile.benefits && Array.isArray(profile.benefits) && profile.benefits.length > 0 && (
                <div style={{ marginTop: '1rem' }}>
                  <strong style={{ color: '#00f0ff' }}>Benefits & Perks:</strong>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '6px' }}>
                    {profile.benefits.map((b: any, idx: number) => (
                      <span key={idx} style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', border: '1px solid rgba(0,255,136,0.3)' }}>
                        ✓ {typeof b === 'string' ? b : b.title || JSON.stringify(b)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>Company Details</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div><strong>Industry:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.industry || 'N/A'}</span></div>
                <div><strong>Company Size:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.companySize || 'N/A'}</span></div>
                <div><strong>Founded:</strong> <span style={{ color: 'var(--text-secondary)' }}>{profile.foundedYear || 'N/A'}</span></div>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', margin: 0, color: 'var(--primary-color)' }}>Active Jobs & Applicants</h2>
                <Link href="/jobs/create" className="btn-primary" style={{ padding: '0.4rem 0.8rem', textDecoration: 'none', fontSize: '0.9rem' }}>Post New Job</Link>
              </div>
              
              {profile.jobs && profile.jobs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {profile.jobs.map((job: any) => (
                    <div key={job.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{job.title}</h3>
                        <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{job.location || 'Remote'} • {job.employmentType || 'Full-time'}</p>
                      </div>
                      <Link href={`/employer-dashboard/jobs/${job.id}/applicants`} className="btn-primary" style={{ padding: '0.4rem 0.8rem', textDecoration: 'none', fontSize: '0.9rem', background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff' }}>
                        View CRM / Applicants
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text-secondary)' }}>No active job postings.</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Right Sidebar */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {user.role === 'JOB_SEEKER' && (
          <>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>AI Career Insights</h3>
              <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <li><strong>Resume Score:</strong> 91%</li>
                <li><strong>Top Matching Jobs:</strong> 48</li>
                <li><strong>Missing Skill:</strong> React Native</li>
                <li><strong>Est. Salary:</strong> ₦850k–₦1.2M/mo</li>
              </ul>
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Activity</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{applications.length}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Applications</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{applications.filter(a => a.status === 'INVITED').length}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Interviews</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>30</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Saved Jobs</div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '8px' }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{profile.profileViews || 0}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Profile Views</div>
                </div>
              </div>
            </div>

            {applications.filter(a => a.status === 'INVITED').length > 0 && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Upcoming Interviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {applications.filter(a => a.status === 'INVITED').map(app => (
                    <div key={app.id} style={{ background: 'rgba(0,240,255,0.1)', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #00f0ff' }}>
                      <div style={{ fontWeight: 'bold', color: 'white' }}>{app.job?.title}</div>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{app.job?.employer?.companyName}</div>
                      <div style={{ fontSize: '0.9rem', color: '#00f0ff' }}>📅 {app.interviewDate ? new Date(app.interviewDate).toLocaleString() : 'TBD'}</div>
                      {app.interviewLink && <div style={{ fontSize: '0.9rem', color: '#00f0ff' }}>🔗 <a href={app.interviewLink} target="_blank" rel="noreferrer" style={{ color: '#00f0ff' }}>Join Meeting</a></div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {user.role === 'EMPLOYER' && (
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--primary-color)' }}>Contact HR</h3>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Name:</strong> {profile.hrContactName || 'N/A'}</p>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Email:</strong> {profile.hrEmail || 'N/A'}</p>
            <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)' }}><strong>Phone:</strong> {profile.hrPhone || 'N/A'}</p>
          </div>
        )}

      </div>
    </main>
  );
}
