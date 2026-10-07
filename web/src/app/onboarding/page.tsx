'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { countriesList, countryStates, phoneCodes } from '../../lib/countriesData';

const getCurrencySymbol = (country: string) => {
  const currencyMapping: { [key: string]: string } = {
    "United States": "$",
    "Canada": "C$",
    "United Kingdom": "£",
    "Nigeria": "₦",
    "India": "₹",
    "Ghana": "GH₵",
    "Kenya": "KSh",
    "South Africa": "R",
    "Australia": "A$",
    "Germany": "€",
    "France": "€",
    "Italy": "€",
    "Spain": "€",
    "Netherlands": "€",
    "Belgium": "€",
    "Switzerland": "CHF",
    "China": "¥",
    "Japan": "¥",
    "Brazil": "R$",
    "Egypt": "EGP",
    "Saudi Arabia": "SR",
    "United Arab Emirates": "AED"
  };
  return currencyMapping[country] || "$";
};


export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Steps
  const [step, setStep] = useState(1);
  
  // Job Seeker Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otherNames, setOtherNames] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneCode, setPhoneCode] = useState('+1');
  const [hrPhoneCode, setHrPhoneCode] = useState('+1');
  const [nationality, setNationality] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  
  const [headline, setHeadline] = useState('');
  const [profession, setProfession] = useState('');
  const [isSkilledProfessional, setIsSkilledProfessional] = useState(false);
  const [skilledProfession, setSkilledProfession] = useState('');
  const [summary, setSummary] = useState('');
  
  const [residenceCountry, setResidenceCountry] = useState('');
  const [residenceState, setResidenceState] = useState('');
  const [residenceCity, setResidenceCity] = useState('');
  const [citizenshipCountry, setCitizenshipCountry] = useState('');
  const [willingToRelocate, setWillingToRelocate] = useState(false);
  
  const [desiredJobTitle, setDesiredJobTitle] = useState('');
  const [preferredIndustry, setPreferredIndustry] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [workArrangement, setWorkArrangement] = useState('');
  const [expectedSalary, setExpectedSalary] = useState('');
  const [availability, setAvailability] = useState('');
  const [preferredWorkCountry, setPreferredWorkCountry] = useState('');
  
  const [education, setEducation] = useState<any[]>([]);
  const [experience, setExperience] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [references, setReferences] = useState<any[]>([]);
  
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', github: '', website: '' });
  
  // Employer Form State
  const [companyName, setCompanyName] = useState('');
  const [description, setDescription] = useState('');
  const [industry, setIndustry] = useState('');
  const [companySize, setCompanySize] = useState('');
  const [foundedYear, setFoundedYear] = useState('');
  const [locationCountry, setLocationCountry] = useState('');
  const [locationState, setLocationState] = useState('');
  const [locationCity, setLocationCity] = useState('');
  
  const [hrContactName, setHrContactName] = useState('');
  const [hrEmail, setHrEmail] = useState('');
  const [hrPhone, setHrPhone] = useState('');
  
  // Shared
  const [profilePicUrl, setProfilePicUrl] = useState('');
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  
  useEffect(() => {
    const fetchUser = async () => {
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
          // Try to fetch existing profile to prepopulate (for Edit mode)
          const endpoint = userData.role === 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
          const profRes = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profRes.ok) {
            const prof = await profRes.json();
            if (userData.role === 'JOB_SEEKER') {
              setFirstName(prof.firstName || '');
              setLastName(prof.lastName || '');
              setOtherNames(prof.otherNames || '');
              setGender(prof.gender || '');
              setDateOfBirth(prof.dateOfBirth ? prof.dateOfBirth.split('T')[0] : '');
              
              const rawPhone = prof.phone || '';
              const matchedCode = phoneCodes.find(pc => rawPhone.startsWith(pc.code));
              if (matchedCode) {
                setPhoneCode(matchedCode.code);
                setPhone(rawPhone.slice(matchedCode.code.length));
              } else {
                setPhoneCode('+1');
                setPhone(rawPhone);
              }

              setNationality(prof.nationality || '');
              setMaritalStatus(prof.maritalStatus || '');
              setHeadline(prof.headline || '');
              setProfession(prof.profession || '');
              setIsSkilledProfessional(prof.isSkilledProfessional || false);
              setSkilledProfession(prof.skilledProfession || '');
              setSummary(prof.summary || '');
              setResidenceCountry(prof.residenceCountry || '');
              setResidenceState(prof.residenceState || '');
              setResidenceCity(prof.residenceCity || '');
              setCitizenshipCountry(prof.citizenshipCountry || '');
              setWillingToRelocate(prof.willingToRelocate || false);
              setDesiredJobTitle(prof.desiredJobTitle || '');
              setPreferredIndustry(prof.preferredIndustry || '');
              setEmploymentType(prof.employmentType || '');
              setWorkArrangement(prof.workArrangement || '');
              setExpectedSalary(prof.expectedSalary || '');
              setAvailability(prof.availability || '');
              const prefWorkCountry = typeof prof.preferredLocations === 'string' ? prof.preferredLocations : (Array.isArray(prof.preferredLocations) && prof.preferredLocations.length > 0 ? prof.preferredLocations[0] : '');
              setPreferredWorkCountry(prefWorkCountry || '');
              setEducation(prof.education || []);
              setExperience(prof.experience || []);
              setCertificates(prof.certificates || []);
              setAchievements(prof.achievements || []);
              setProjects(prof.projects || []);
              setReferences(prof.references || []);
              setSocialLinks(prof.socialLinks || { linkedin: '', github: '', website: '' });
              setProfilePicUrl(prof.profilePicture || '');
            } else {
              setCompanyName(prof.companyName || '');
              setDescription(prof.description || '');
              setIndustry(prof.industry || '');
              setCompanySize(prof.companySize || '');
              setFoundedYear(prof.foundedYear ? prof.foundedYear.toString() : '');
              setLocationCountry(prof.locationCountry || '');
              setLocationState(prof.locationState || '');
              setLocationCity(prof.locationCity || '');
              setHrContactName(prof.hrContactName || '');
              setHrEmail(prof.hrEmail || '');
              
              const rawHrPhone = prof.hrPhone || '';
              const matchedHrCode = phoneCodes.find(pc => rawHrPhone.startsWith(pc.code));
              if (matchedHrCode) {
                setHrPhoneCode(matchedHrCode.code);
                setHrPhone(rawHrPhone.slice(matchedHrCode.code.length));
              } else {
                setHrPhoneCode('+1');
                setHrPhone(rawHrPhone);
              }

              setProfilePicUrl(prof.profilePicture || '');
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
    fetchUser();
  }, [router]);

  const handleFileUpload = async () => {
    if (!profilePicFile) return profilePicUrl;
    const formData = new FormData();
    formData.append('file', profilePicFile);
    try {
      const res = await fetch('/api/uploads/profile-picture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        return data.url;
      }
    } catch (e) {
      console.error('File upload failed', e);
    }
    return profilePicUrl;
  };

  const handleSave = async () => {
    setSaving(true);
    const uploadedUrl = await handleFileUpload();
    const token = localStorage.getItem('token');
    
    let payload = {};
    let endpoint = '';
    
    if (user?.role === 'JOB_SEEKER') {
      endpoint = '/profiles/job-seeker';
      payload = {
        firstName, lastName, otherNames, gender, phone: phoneCode + phone, nationality, maritalStatus,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth).toISOString() : null,
        headline, profession, isSkilledProfessional, skilledProfession, summary,
        residenceCountry, residenceState, residenceCity, citizenshipCountry, willingToRelocate,
        desiredJobTitle, preferredIndustry, employmentType, workArrangement, expectedSalary, availability,
        preferredLocations: preferredWorkCountry,
        education, experience, certificates, achievements, projects, references,
        socialLinks, profilePicture: uploadedUrl, skills: []
      };
    } else {
      endpoint = '/profiles/employer';
      payload = {
        companyName, description, industry, companySize, foundedYear: parseInt(foundedYear) || null,
        locationCountry, locationState, locationCity, hrContactName, hrEmail, hrPhone: hrPhoneCode + hrPhone, profilePicture: uploadedUrl
      };
    }
    
    try {
      const res = await fetch(`/api${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        window.location.href = '/profile';
      } else {
        alert('Failed to save profile.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '5rem' }}>Loading...</div>;

  const renderSeekerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="fly-in">
            <h2>Personal Information</h2>
            <input placeholder="First Name" value={firstName} onChange={e => setFirstName(e.target.value)} className="input-field" />
            <input placeholder="Last Name" value={lastName} onChange={e => setLastName(e.target.value)} className="input-field" />
            <input placeholder="Other Names (Optional)" value={otherNames} onChange={e => setOtherNames(e.target.value)} className="input-field" />
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Phone Number</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <select value={phoneCode} onChange={e => setPhoneCode(e.target.value)} className="input-field" style={{ width: '130px', marginBottom: 0 }}>
                {phoneCodes.map(pc => (
                  <option key={pc.code + pc.name} value={pc.code}>{pc.code} ({pc.name})</option>
                ))}
              </select>
              <input placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} className="input-field" style={{ flex: 1, marginBottom: 0 }} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <select value={gender} onChange={e => setGender(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              <select value={maritalStatus} onChange={e => setMaritalStatus(e.target.value)} className="input-field" style={{ marginBottom: 0 }}>
                <option value="">Marital Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </div>
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>Date of Birth</label>
            <input type="date" value={dateOfBirth} onChange={e => setDateOfBirth(e.target.value)} className="input-field" title="Date of Birth" />
          </div>
        );
      case 2:
        return (
          <div className="fly-in">
            <h2>Professional Identity</h2>
            <input placeholder="Professional Headline (e.g. Senior Software Developer)" value={headline} onChange={e => setHeadline(e.target.value)} className="input-field" />
            <input placeholder="Primary Profession" value={profession} onChange={e => setProfession(e.target.value)} className="input-field" />
            <textarea placeholder="Professional Summary (About Me)" value={summary} onChange={e => setSummary(e.target.value)} className="input-field" rows={4} />
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0', color: 'white' }}>
              <input type="checkbox" checked={isSkilledProfessional} onChange={e => setIsSkilledProfessional(e.target.checked)} />
              I am a skilled/trade professional
            </label>
            {isSkilledProfessional && (
              <input placeholder="Specify Skill/Trade" value={skilledProfession} onChange={e => setSkilledProfession(e.target.value)} className="input-field" />
            )}
          </div>
        );
      case 3:
        return (
          <div className="fly-in">
            <h2>Location & Preferences</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <label style={{ color: 'white', fontSize: '0.9rem' }}>Resident Country</label>
              <select value={residenceCountry} onChange={e => {
                setResidenceCountry(e.target.value);
                setResidenceState('');
              }} className="input-field">
                <option value="">Select Resident Country</option>
                {countriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <label style={{ color: 'white', fontSize: '0.9rem' }}>Citizenship Country / Nationality</label>
              <select value={citizenshipCountry} onChange={e => {
                setCitizenshipCountry(e.target.value);
                setNationality(e.target.value);
              }} className="input-field">
                <option value="">Select Citizenship Country</option>
                {countriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <label style={{ color: 'white', fontSize: '0.9rem' }}>State / Province</label>
              {residenceCountry && countryStates[residenceCountry] ? (
                <>
                  <select 
                    value={countryStates[residenceCountry].includes(residenceState) ? residenceState : (residenceState ? 'OTHER_STATE' : '')} 
                    onChange={e => {
                      if (e.target.value === 'OTHER_STATE') {
                        setResidenceState('');
                      } else {
                        setResidenceState(e.target.value);
                      }
                    }} 
                    className="input-field"
                  >
                    <option value="">Select State</option>
                    {countryStates[residenceCountry].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="OTHER_STATE">Other / Enter Manually</option>
                  </select>
                  {(!residenceState || !countryStates[residenceCountry].includes(residenceState)) && (
                    <input 
                      placeholder="Enter State Manually" 
                      value={residenceState} 
                      onChange={e => setResidenceState(e.target.value)} 
                      className="input-field" 
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder="State / Province" 
                  value={residenceState} 
                  onChange={e => setResidenceState(e.target.value)} 
                  className="input-field" 
                  disabled={!residenceCountry}
                />
              )}

              <label style={{ color: 'white', fontSize: '0.9rem' }}>City / Town</label>
              <input placeholder="City / Town" value={residenceCity} onChange={e => setResidenceCity(e.target.value)} className="input-field" />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <label style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <input type="checkbox" checked={willingToRelocate} onChange={e => setWillingToRelocate(e.target.checked)} />
                Willing to relocate
              </label>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="fly-in">
            <h2>Job Preferences</h2>
            <input placeholder="Desired Job Title" value={desiredJobTitle} onChange={e => setDesiredJobTitle(e.target.value)} className="input-field" />
            <input placeholder="Preferred Industry" value={preferredIndustry} onChange={e => setPreferredIndustry(e.target.value)} className="input-field" />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={employmentType} onChange={e => setEmploymentType(e.target.value)} className="input-field">
                <option value="">Employment Type</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
              </select>
              <select value={workArrangement} onChange={e => setWorkArrangement(e.target.value)} className="input-field">
                <option value="">Work Arrangement</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
            <label style={{ color: 'white', fontSize: '0.9rem', display: 'block', marginBottom: '0.2rem' }}>Preferred Country to Work In</label>
            <select value={preferredWorkCountry} onChange={e => setPreferredWorkCountry(e.target.value)} className="input-field">
              <option value="">Select Preferred Work Country</option>
              {countriesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <span style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                  {getCurrencySymbol(preferredWorkCountry)}
                </span>
                <input 
                  placeholder="Expected Salary" 
                  value={expectedSalary} 
                  onChange={e => setExpectedSalary(e.target.value)} 
                  className="input-field" 
                  style={{ paddingLeft: '2.5rem' }} 
                />
              </div>
              
              <div style={{ flex: 1 }}>
                <select value={availability} onChange={e => setAvailability(e.target.value)} className="input-field">
                  <option value="">Select Availability</option>
                  <option value="Immediately">Immediately</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="fly-in">
            <h2>Education</h2>
            <button className="btn-primary" onClick={() => setEducation([...education, { school: '', course: '', dates: '', yearGraduated: '' }])}>Add Education</button>
            {education.map((ed, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Institution / School" value={ed.school} onChange={e => { const n = [...education]; n[idx].school = e.target.value; setEducation(n); }} className="input-field" />
                <input placeholder="Course of Study" value={ed.course} onChange={e => { const n = [...education]; n[idx].course = e.target.value; setEducation(n); }} className="input-field" />
                <input placeholder="Dates (e.g. 2018-2022)" value={ed.dates} onChange={e => { const n = [...education]; n[idx].dates = e.target.value; setEducation(n); }} className="input-field" />
              </div>
            ))}
          </div>
        );
      case 6:
        return (
          <div className="fly-in">
            <h2>Experience</h2>
            <button className="btn-primary" onClick={() => setExperience([...experience, { company: '', role: '', dates: '', responsibilities: '' }])}>Add Experience</button>
            {experience.map((ex, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Company" value={ex.company} onChange={e => { const n = [...experience]; n[idx].company = e.target.value; setExperience(n); }} className="input-field" />
                <input placeholder="Role" value={ex.role} onChange={e => { const n = [...experience]; n[idx].role = e.target.value; setExperience(n); }} className="input-field" />
                <input placeholder="Dates (e.g. Jan 2020 - Present)" value={ex.dates} onChange={e => { const n = [...experience]; n[idx].dates = e.target.value; setExperience(n); }} className="input-field" />
                <textarea placeholder="Responsibilities & Achievements" value={ex.responsibilities || ''} onChange={e => { const n = [...experience]; n[idx].responsibilities = e.target.value; setExperience(n); }} className="input-field" rows={3} />
              </div>
            ))}
          </div>
        );
      case 7:
        return (
          <div className="fly-in">
            <h2>Certifications & Projects</h2>
            <button className="btn-primary" onClick={() => setCertificates([...certificates, { name: '', date: '' }])}>Add Certification</button>
            {certificates.map((cert, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Certification Name" value={cert.name} onChange={e => { const n = [...certificates]; n[idx].name = e.target.value; setCertificates(n); }} className="input-field" />
                <input placeholder="Date Obtained" value={cert.date} onChange={e => { const n = [...certificates]; n[idx].date = e.target.value; setCertificates(n); }} className="input-field" />
              </div>
            ))}
            <hr style={{ margin: '1rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
            <button className="btn-primary" onClick={() => setProjects([...projects, { title: '', description: '', liveLink: '' }])}>Add Project</button>
            {projects.map((proj, idx) => (
              <div key={idx} style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', marginTop: '0.5rem', borderRadius: '8px' }}>
                <input placeholder="Project Title" value={proj.title} onChange={e => { const n = [...projects]; n[idx].title = e.target.value; setProjects(n); }} className="input-field" />
                <input placeholder="Description" value={proj.description} onChange={e => { const n = [...projects]; n[idx].description = e.target.value; setProjects(n); }} className="input-field" />
                <input placeholder="Live Link (Optional)" value={proj.liveLink} onChange={e => { const n = [...projects]; n[idx].liveLink = e.target.value; setProjects(n); }} className="input-field" />
              </div>
            ))}
          </div>
        );
      case 8:
        return (
          <div className="fly-in">
            <h2>Social Links & Profile Picture</h2>
            <input placeholder="LinkedIn URL" value={socialLinks.linkedin} onChange={e => setSocialLinks({...socialLinks, linkedin: e.target.value})} className="input-field" />
            <input placeholder="GitHub URL" value={socialLinks.github} onChange={e => setSocialLinks({...socialLinks, github: e.target.value})} className="input-field" />
            <input placeholder="Personal Website" value={socialLinks.website} onChange={e => setSocialLinks({...socialLinks, website: e.target.value})} className="input-field" />
            
            <h3 style={{ marginTop: '1rem' }}>Profile Picture</h3>
            {profilePicUrl && <img src={profilePicUrl} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />}
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setProfilePicFile(e.target.files[0]);
                setProfilePicUrl(URL.createObjectURL(e.target.files[0]));
              }
            }} className="input-field" />
          </div>
        );
      default: return null;
    }
  };

  const renderEmployerSteps = () => {
    switch (step) {
      case 1:
        return (
          <div className="fly-in">
            <h2>Company Information</h2>
            <input placeholder="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} className="input-field" />
            <textarea placeholder="Company Description" value={description} onChange={e => setDescription(e.target.value)} className="input-field" rows={4} />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input placeholder="Industry" value={industry} onChange={e => setIndustry(e.target.value)} className="input-field" />
              <input placeholder="Company Size (e.g. 10-50)" value={companySize} onChange={e => setCompanySize(e.target.value)} className="input-field" />
              <input placeholder="Founded Year" type="number" value={foundedYear} onChange={e => setFoundedYear(e.target.value)} className="input-field" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="fly-in">
            <h2>Location & Contact</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <label style={{ color: 'white', fontSize: '0.9rem' }}>Country</label>
              <select value={locationCountry} onChange={e => {
                setLocationCountry(e.target.value);
                setLocationState('');
              }} className="input-field">
                <option value="">Select Country</option>
                {countriesList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <label style={{ color: 'white', fontSize: '0.9rem' }}>State / Province</label>
              {locationCountry && countryStates[locationCountry] ? (
                <>
                  <select 
                    value={countryStates[locationCountry].includes(locationState) ? locationState : (locationState ? 'OTHER_STATE' : '')} 
                    onChange={e => {
                      if (e.target.value === 'OTHER_STATE') {
                        setLocationState('');
                      } else {
                        setLocationState(e.target.value);
                      }
                    }} 
                    className="input-field"
                  >
                    <option value="">Select State</option>
                    {countryStates[locationCountry].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    <option value="OTHER_STATE">Other / Enter Manually</option>
                  </select>
                  {(!locationState || !countryStates[locationCountry].includes(locationState)) && (
                    <input 
                      placeholder="Enter State Manually" 
                      value={locationState} 
                      onChange={e => setLocationState(e.target.value)} 
                      className="input-field" 
                    />
                  )}
                </>
              ) : (
                <input 
                  placeholder="State / Province" 
                  value={locationState} 
                  onChange={e => setLocationState(e.target.value)} 
                  className="input-field" 
                  disabled={!locationCountry}
                />
              )}

              <label style={{ color: 'white', fontSize: '0.9rem' }}>City / Town</label>
              <input placeholder="City / Town" value={locationCity} onChange={e => setLocationCity(e.target.value)} className="input-field" />
            </div>
            
            <hr style={{ margin: '1.5rem 0', borderColor: 'rgba(255,255,255,0.1)' }} />
            <h2>Contact Person (HR)</h2>
            <input placeholder="HR Contact Name" value={hrContactName} onChange={e => setHrContactName(e.target.value)} className="input-field" />
            <input placeholder="HR Email" value={hrEmail} onChange={e => setHrEmail(e.target.value)} className="input-field" />
            
            <label style={{ color: 'white', display: 'block', marginBottom: '0.2rem', fontSize: '0.9rem' }}>HR Phone</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select value={hrPhoneCode} onChange={e => setHrPhoneCode(e.target.value)} className="input-field" style={{ width: '130px', marginBottom: 0 }}>
                {phoneCodes.map(pc => (
                  <option key={pc.code + pc.name} value={pc.code}>{pc.code} ({pc.name})</option>
                ))}
              </select>
              <input placeholder="HR Phone" value={hrPhone} onChange={e => setHrPhone(e.target.value)} className="input-field" style={{ flex: 1, marginBottom: 0 }} />
            </div>
          </div>
        );
      case 3:
        return (
          <div className="fly-in">
            <h2>Company Logo</h2>
            {profilePicUrl && <img src={profilePicUrl} alt="Preview" style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', marginBottom: '1rem' }} />}
            <input type="file" accept="image/*" onChange={e => {
              if (e.target.files && e.target.files[0]) {
                setProfilePicFile(e.target.files[0]);
                setProfilePicUrl(URL.createObjectURL(e.target.files[0]));
              }
            }} className="input-field" />
          </div>
        );
      default: return null;
    }
  };

  const totalSteps = user?.role === 'JOB_SEEKER' ? 8 : 3;

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <style>{`
        .fly-in { animation: flyIn 0.5s ease-out forwards; }
        @keyframes flyIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .input-field { width: 100%; padding: 1rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background-color: rgba(255,255,255,0.05); color: white; font-size: 1rem; outline: none; margin-bottom: 1rem; }
        select.input-field option { background-color: #120b1c; color: white; }
      `}</style>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '3rem 2rem', overflow: 'hidden' }}>
        <h1 className="text-gradient" style={{ textAlign: 'center', margin: 0 }}>Complete Your Profile</h1>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Step {step} of {totalSteps}</p>
        <div style={{ margin: '2rem 0' }}>
          {user?.role === 'JOB_SEEKER' ? renderSeekerSteps() : renderEmployerSteps()}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
          {step > 1 ? (
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid #00f0ff' }} onClick={() => setStep(step - 1)}>Back</button>
          ) : <div />}
          
          {step < totalSteps ? (
            <button className="btn-primary" onClick={() => setStep(step + 1)}>Next</button>
          ) : (
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Profile'}</button>
          )}
        </div>
      </div>
    </main>
  );
}
