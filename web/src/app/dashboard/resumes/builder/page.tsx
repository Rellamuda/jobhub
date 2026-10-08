'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, RefreshCw, Download, ArrowLeft, Plus, Trash2, CheckCircle2 } from 'lucide-react';

function ResumeBuilder() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');
  const parsedDataParam = searchParams.get('parsedData');
  
  const [resume, setResume] = useState({
    title: 'Executive Professional Resume',
    summary: '',
    personalInfo: { firstName: '', lastName: '', email: '', phone: '', city: '' },
    experience: [] as any[],
    education: [] as any[],
    skills: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Role Guard: Only Job Seekers are allowed to build resumes
    fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(user => {
        if (user && user.role === 'EMPLOYER') {
          window.location.href = '/dashboard/employer/jobs/new';
          return;
        }
      })
      .catch(console.error);

    if (parsedDataParam) {
      try {
        const parsed = JSON.parse(decodeURIComponent(parsedDataParam));
        setResume(prev => ({ ...prev, ...parsed }));
      } catch(e) {}
    } else if (resumeId) {
      fetch(`/api/resumes/${resumeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => setResume(data))
        .catch(err => console.error(err));
    } else {
      // Automatically pull onboarding profile data so user never re-fills from scratch
      fetch('/api/profiles/job-seeker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(prof => {
          if (prof) {
            setResume(prev => ({
              ...prev,
              title: `${prof.firstName || ''} ${prof.lastName || ''} - ${prof.desiredJobTitle || prof.profession || 'Resume'}`.trim(),
              summary: prof.summary || prof.headline || prof.bio || '',
              personalInfo: {
                firstName: prof.firstName || '',
                lastName: prof.lastName || '',
                email: prof.user?.email || '',
                phone: prof.phone || '',
                city: [prof.residenceCity, prof.residenceCountry].filter(Boolean).join(', ')
              },
              experience: Array.isArray(prof.experience) ? prof.experience : [],
              education: Array.isArray(prof.education) ? prof.education : [],
              skills: Array.isArray(prof.skills) ? prof.skills : []
            }));
          }
        })
        .catch(console.error);
    }
  }, [resumeId, parsedDataParam]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const token = localStorage.getItem('token');
      await fetch('/api/resumes', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ id: resumeId, ...resume })
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
      alert('Error saving resume');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddExperience = () => {
    setResume(prev => ({
      ...prev,
      experience: [
        ...prev.experience,
        { role: 'New Role / Title', company: 'Company Name', dates: '2023 - Present', responsibilities: 'Key contributions and achievements...' }
      ]
    }));
  };

  const handleRemoveExperience = (index: number) => {
    setResume(prev => ({
      ...prev,
      experience: prev.experience.filter((_, i) => i !== index)
    }));
  };

  const handleAddEducation = () => {
    setResume(prev => ({
      ...prev,
      education: [
        ...prev.education,
        { school: 'University / Institute', course: 'Degree / Major', dates: '2019 - 2023' }
      ]
    }));
  };

  const handleRemoveEducation = (index: number) => {
    setResume(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-resume, #printable-resume * {
            visibility: visible;
          }
          #printable-resume {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20mm;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="p-4 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Navigation & Controls */}
        <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/resumes">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-300 hover:text-white">
                <ArrowLeft className="w-4 h-4" /> Resumes List
              </Button>
            </Link>
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setActiveTab('editor')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'editor' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                ✏️ Form Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'preview' ? 'bg-cyan-500 text-black font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                📄 Executive Preview
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Button 
              onClick={handlePrint}
              className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold shadow-lg shadow-cyan-500/20"
            >
              <Download className="w-4 h-4" /> Download PDF / Print
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save in Dashboard'}
            </Button>
          </div>
        </div>

        {saveSuccess && (
          <div className="no-print p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-xl flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Resume built and safely saved to your dashboard!
            </span>
            <Link href="/dashboard/resumes" className="underline text-emerald-400 font-semibold">
              View All Resumes
            </Link>
          </div>
        )}

        {/* Title Input */}
        <div className="no-print">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Resume Title / Role:</label>
          <Input 
            value={resume.title} 
            onChange={e => setResume({...resume, title: e.target.value})}
            className="text-2xl md:text-3xl font-black bg-transparent border-b border-white/20 px-0 rounded-none focus-visible:ring-0 text-white" 
          />
        </div>

        {activeTab === 'editor' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              {/* Professional Summary */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold flex items-center gap-2 text-cyan-300">
                  <FileText className="w-4 h-4"/> Professional Summary (Auto-populated from Profile)
                </h3>
                <Textarea 
                  value={resume.summary} 
                  onChange={e => setResume({...resume, summary: e.target.value})}
                  rows={4} 
                  className="bg-black/30 border-white/10 text-white text-sm"
                  placeholder="A concise summary of your professional expertise..." 
                />
              </div>
              
              {/* Work Experience */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold flex items-center gap-2 text-cyan-300">
                    <FileText className="w-4 h-4"/> Work Experience
                  </h3>
                  <Button size="sm" onClick={handleAddExperience} className="gap-1.5 text-xs bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40">
                    <Plus className="w-3.5 h-3.5" /> Add Experience
                  </Button>
                </div>
                
                {resume.experience.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No experience entries yet. Click &quot;Add Experience&quot; to add one.</p>
                ) : (
                  resume.experience.map((exp: any, i: number) => (
                    <div key={i} className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Input 
                          placeholder="Job Title / Role" 
                          value={exp.role || ''} 
                          onChange={e => {
                            const newExp = [...resume.experience];
                            newExp[i] = { ...newExp[i], role: e.target.value };
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="bg-transparent border-none text-white font-bold p-0 text-base focus-visible:ring-0"
                        />
                        <button 
                          onClick={() => handleRemoveExperience(i)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Company Name" 
                          value={exp.company || ''} 
                          onChange={e => {
                            const newExp = [...resume.experience];
                            newExp[i] = { ...newExp[i], company: e.target.value };
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="bg-black/30 border-white/10 text-xs text-cyan-400"
                        />
                        <Input 
                          placeholder="Dates (e.g. 2021 - Present)" 
                          value={exp.dates || ''} 
                          onChange={e => {
                            const newExp = [...resume.experience];
                            newExp[i] = { ...newExp[i], dates: e.target.value };
                            setResume({ ...resume, experience: newExp });
                          }}
                          className="bg-black/30 border-white/10 text-xs text-gray-400"
                        />
                      </div>
                      <Textarea 
                        placeholder="Responsibilities & Key Achievements..." 
                        value={exp.responsibilities || ''} 
                        onChange={e => {
                          const newExp = [...resume.experience];
                          newExp[i] = { ...newExp[i], responsibilities: e.target.value };
                          setResume({ ...resume, experience: newExp });
                        }}
                        rows={2}
                        className="bg-black/30 border-white/10 text-xs text-gray-300"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Education */}
              <div className="space-y-4 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <div className="flex justify-between items-center">
                  <h3 className="text-base font-bold flex items-center gap-2 text-cyan-300">
                    <FileText className="w-4 h-4"/> Education & Credentials
                  </h3>
                  <Button size="sm" onClick={handleAddEducation} className="gap-1.5 text-xs bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40">
                    <Plus className="w-3.5 h-3.5" /> Add Education
                  </Button>
                </div>

                {resume.education.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No education entries yet. Click &quot;Add Education&quot; to add one.</p>
                ) : (
                  resume.education.map((edu: any, i: number) => (
                    <div key={i} className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Input 
                          placeholder="Degree / Course" 
                          value={edu.course || edu.degree || ''} 
                          onChange={e => {
                            const newEdu = [...resume.education];
                            newEdu[i] = { ...newEdu[i], course: e.target.value };
                            setResume({ ...resume, education: newEdu });
                          }}
                          className="bg-transparent border-none text-white font-bold p-0 text-base focus-visible:ring-0"
                        />
                        <button 
                          onClick={() => handleRemoveEducation(i)}
                          className="text-red-400 hover:text-red-300 p-1 rounded"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Input 
                          placeholder="Institution / University" 
                          value={edu.school || edu.institution || ''} 
                          onChange={e => {
                            const newEdu = [...resume.education];
                            newEdu[i] = { ...newEdu[i], school: e.target.value };
                            setResume({ ...resume, education: newEdu });
                          }}
                          className="bg-black/30 border-white/10 text-xs text-cyan-400"
                        />
                        <Input 
                          placeholder="Year / Dates" 
                          value={edu.dates || edu.yearGraduated || ''} 
                          onChange={e => {
                            const newEdu = [...resume.education];
                            newEdu[i] = { ...newEdu[i], dates: e.target.value };
                            setResume({ ...resume, education: newEdu });
                          }}
                          className="bg-black/30 border-white/10 text-xs text-gray-400"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Sidebar: Personal Info, Skills, Additional Information */}
            <div className="space-y-6">
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Candidate Details</h3>
                <Input 
                  placeholder="First Name" 
                  value={resume.personalInfo?.firstName || ''} 
                  onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, firstName: e.target.value}})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
                <Input 
                  placeholder="Last Name" 
                  value={resume.personalInfo?.lastName || ''} 
                  onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, lastName: e.target.value}})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
                <Input 
                  placeholder="Email" 
                  value={resume.personalInfo?.email || ''} 
                  onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, email: e.target.value}})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
                <Input 
                  placeholder="Phone" 
                  value={resume.personalInfo?.phone || ''} 
                  onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, phone: e.target.value}})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
                <Input 
                  placeholder="City / Country" 
                  value={resume.personalInfo?.city || ''} 
                  onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, city: e.target.value}})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
              </div>

              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-white border-b border-white/10 pb-2">Skills & Proficiencies</h3>
                <p className="text-xs text-gray-400">Comma-separated (e.g. Next.js, Node.js, AWS, Python)</p>
                <Input 
                  placeholder="Skills (comma separated)" 
                  value={Array.isArray(resume.skills) ? resume.skills.join(', ') : ''} 
                  onChange={e => setResume({...resume, skills: e.target.value.split(',').map(s => s.trim())})}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
              </div>

              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-cyan-300 border-b border-white/10 pb-2">✨ Additional Details</h3>
                <p className="text-xs text-gray-400">Add any new projects, certifications, or custom information:</p>
                <Textarea 
                  placeholder="e.g. AWS Certified Solutions Architect. Led product scaling to 100k MAU..."
                  rows={4}
                  className="bg-black/30 border-white/10 text-white text-xs"
                  onChange={e => {
                    const addVal = e.target.value;
                    setResume(prev => ({
                      ...prev,
                      summary: prev.summary.includes('\n\nKey Highlights:') 
                        ? prev.summary.split('\n\nKey Highlights:')[0] + (addVal ? `\n\nKey Highlights: ${addVal}` : '')
                        : prev.summary + (addVal ? `\n\nKey Highlights: ${addVal}` : '')
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Executive Print / PDF Document Container */}
        <div 
          id="printable-resume" 
          className={`bg-white text-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl space-y-6 ${activeTab === 'editor' ? 'hidden md:block' : 'block'}`}
          style={{ minHeight: '800px', maxWidth: '850px', margin: '0 auto' }}
        >
          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-4">
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
              {resume.personalInfo?.firstName} {resume.personalInfo?.lastName}
            </h1>
            <p className="text-base font-bold text-indigo-700 tracking-wide mt-1">
              {resume.title}
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 mt-2 font-medium">
              {resume.personalInfo?.email && <span>📧 {resume.personalInfo.email}</span>}
              {resume.personalInfo?.phone && <span>📱 {resume.personalInfo.phone}</span>}
              {resume.personalInfo?.city && <span>📍 {resume.personalInfo.city}</span>}
            </div>
          </div>

          {/* Executive Summary */}
          {resume.summary && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Executive Summary
              </h2>
              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line font-serif">
                {resume.summary}
              </p>
            </div>
          )}

          {/* Core Competencies / Skills */}
          {resume.skills && resume.skills.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Core Competencies & Skills
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((skill, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded font-medium border border-gray-200">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work Experience */}
          {resume.experience && resume.experience.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Professional Experience
              </h2>
              <div className="space-y-4">
                {resume.experience.map((exp: any, i: number) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between items-baseline text-xs">
                      <span className="font-bold text-gray-900 text-sm">{exp.role}</span>
                      <span className="text-gray-500 italic font-mono">{exp.dates}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-700">{exp.company}</div>
                    {exp.responsibilities && (
                      <p className="text-xs text-gray-700 leading-relaxed font-serif pl-2 border-l-2 border-gray-200 whitespace-pre-line">
                        {exp.responsibilities}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {resume.education && resume.education.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 border-b border-gray-200 pb-1">
                Education & Credentials
              </h2>
              <div className="space-y-2">
                {resume.education.map((edu: any, i: number) => (
                  <div key={i} className="flex justify-between items-baseline text-xs">
                    <div>
                      <span className="font-bold text-gray-900">{edu.course || edu.degree}</span>
                      <span className="text-gray-600"> — {edu.school || edu.institution}</span>
                    </div>
                    <span className="text-gray-500 italic font-mono">{edu.dates || edu.yearGraduated}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 text-center border-t border-gray-100 text-[10px] text-gray-400 font-mono">
            Verified via JobHub AI Ecosystem • JobHub Digital Credentials
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-5xl mx-auto text-white">Loading resume builder...</div>}>
      <ResumeBuilder />
    </Suspense>
  );
}
