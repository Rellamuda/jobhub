'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, Sparkles, Download, ArrowLeft, Plus, Trash2, CheckCircle2, Copy, Mail, Printer } from 'lucide-react';

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

  const [additionalInfo, setAdditionalInfo] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedCoverLetter, setCopiedCoverLetter] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview' | 'coverletter'>('editor');

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
        .then(data => {
          if (data) {
            setResume(data);
            if (data.coverLetter) setCoverLetter(data.coverLetter);
          }
        })
        .catch(err => console.error(err));
    } else {
      // Automatically pull onboarding profile data so user never re-fills from scratch
      fetch('/api/profiles/job-seeker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(prof => {
          if (prof) {
            const fName = prof.firstName || '';
            const lName = prof.lastName || '';
            const targetRole = prof.desiredJobTitle || prof.profession || 'Resume';
            setResume(prev => ({
              ...prev,
              title: `${fName} ${lName} - ${targetRole}`.trim(),
              summary: prof.summary || prof.headline || prof.bio || '',
              personalInfo: {
                firstName: fName,
                lastName: lName,
                email: prof.user?.email || prof.email || '',
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

  const handleGenerateAIResume = async () => {
    setIsGeneratingAI(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...resume,
        additionalInfo: additionalInfo.trim(),
        firstName: resume.personalInfo?.firstName,
        lastName: resume.personalInfo?.lastName,
        email: resume.personalInfo?.email,
        phone: resume.personalInfo?.phone,
        city: resume.personalInfo?.city,
        desiredJobTitle: resume.title
      };

      const res = await fetch('/api/ai/resume/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.structured) {
          setResume(prev => ({
            ...prev,
            title: data.structured.title || prev.title,
            summary: data.structured.summary || prev.summary,
            skills: data.structured.skills || prev.skills,
            experience: data.structured.experience || prev.experience,
            education: data.structured.education || prev.education,
            personalInfo: {
              ...prev.personalInfo,
              ...(data.structured.personalInfo || {})
            }
          }));
        } else if (data.resume && typeof data.resume === 'string') {
          // If returned as raw text, enhance summary
          setResume(prev => ({
            ...prev,
            summary: prev.summary ? `${prev.summary}\n\n${data.resume.slice(0, 300)}...` : data.resume
          }));
        }

        // Also generate matching cover letter automatically
        generateMatchingCoverLetter(payload);
        setActiveTab('preview');
      } else {
        alert('Could not generate resume at this moment. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI generation service.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const generateMatchingCoverLetter = async (profileData: any) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/cover-letter/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          profile: profileData,
          job: {
            title: resume.title,
            companyName: 'Prospective Employer',
            description: `Key requirements for ${resume.title} role leveraging skills: ${resume.skills.join(', ')}`
          }
        })
      });
      if (res.ok) {
        const clData = await res.json();
        if (clData.cover_letter) {
          setCoverLetter(clData.cover_letter);
        }
      }
    } catch (e) {
      console.error('Error generating cover letter:', e);
    }
  };

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
        body: JSON.stringify({ id: resumeId, ...resume, coverLetter })
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

  const handleDownloadDoc = () => {
    const fName = resume.personalInfo?.firstName || 'Valued';
    const lName = resume.personalInfo?.lastName || 'Candidate';
    const skillsHtml = resume.skills.map(s => `<span style="background:#f3f4f6;padding:4px 8px;margin-right:6px;border-radius:4px;display:inline-block;">${s}</span>`).join(' ');
    
    const expHtml = resume.experience.map(e => `
      <div style="margin-bottom:14px;">
        <div style="display:flex;justify-content:space-between;font-weight:bold;">
          <span>${e.role || ''}</span>
          <span style="color:#666;">${e.dates || ''}</span>
        </div>
        <div style="color:#4338ca;font-size:13px;margin-bottom:4px;">${e.company || ''}</div>
        <div style="font-size:13px;line-height:1.5;white-space:pre-line;">${e.responsibilities || ''}</div>
      </div>
    `).join('');

    const eduHtml = resume.education.map(ed => `
      <div style="margin-bottom:8px;font-size:13px;">
        <strong>${ed.course || ed.degree || ''}</strong> — ${ed.school || ed.institution || ''} (${ed.dates || ed.yearGraduated || ''})
      </div>
    `).join('');

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>RESUME</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.5; color: #111; padding: 30px; }
        .resume-title { font-size: 14pt; font-weight: bold; letter-spacing: 3px; color: #4338ca; text-transform: uppercase; margin-bottom: 4px; text-align: center; }
        .name { font-size: 22pt; font-weight: bold; text-align: center; margin-bottom: 4px; }
        .sub { font-size: 12pt; font-weight: bold; text-align: center; color: #4b5563; margin-bottom: 8px; }
        .contact { font-size: 10pt; color: #6b7280; text-align: center; margin-bottom: 20px; border-bottom: 2px solid #111; padding-bottom: 12px; }
        .section-header { font-size: 12pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #d1d5db; padding-bottom: 4px; margin-top: 18px; margin-bottom: 8px; color: #111; }
      </style>
      </head>
      <body>
        <div class="resume-title">RESUME</div>
        <div class="name">${fName} ${lName}</div>
        <div class="sub">${resume.title}</div>
        <div class="contact">
          ${resume.personalInfo?.email ? 'Email: ' + resume.personalInfo.email + ' | ' : ''}
          ${resume.personalInfo?.phone ? 'Phone: ' + resume.personalInfo.phone + ' | ' : ''}
          ${resume.personalInfo?.city ? 'Location: ' + resume.personalInfo.city : ''}
        </div>
        
        ${resume.summary ? `<div class="section-header">Executive Summary</div><p style="font-size:11pt;line-height:1.5;">${resume.summary}</p>` : ''}
        
        ${resume.skills.length > 0 ? `<div class="section-header">Core Competencies & Skills</div><div style="margin-top:6px;">${skillsHtml}</div>` : ''}

        ${resume.experience.length > 0 ? `<div class="section-header">Professional Experience</div>${expHtml}` : ''}

        ${resume.education.length > 0 ? `<div class="section-header">Education & Credentials</div>${eduHtml}` : ''}

        <div style="margin-top:30px;text-align:center;font-size:9pt;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:10px;">
          Generated via JobHub AI Ecosystem • JobHub Digital Credentials
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fName}_${lName}_RESUME.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCoverLetterDoc = () => {
    const fName = resume.personalInfo?.firstName || 'Candidate';
    const lName = resume.personalInfo?.lastName || '';
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><title>Cover Letter</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #111; padding: 40px; font-size: 11pt; }
        .header { margin-bottom: 30px; }
        .body { white-space: pre-line; }
      </style>
      </head>
      <body>
        <div class="header">
          <strong>${fName} ${lName}</strong><br/>
          ${resume.personalInfo?.email || ''}<br/>
          ${resume.personalInfo?.phone || ''}<br/>
          ${resume.personalInfo?.city || ''}
        </div>
        <div class="body">${coverLetter}</div>
      </body>
      </html>
    `;
    const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fName}_${lName}_Cover_Letter.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyCoverLetter = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopiedCoverLetter(true);
    setTimeout(() => setCopiedCoverLetter(false), 3000);
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
        { course: 'Degree / Major', school: 'University / Institute', dates: '2019 - 2023' }
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
          <div className="flex items-center gap-3 flex-wrap">
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
              <button
                onClick={() => setActiveTab('coverletter')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${activeTab === 'coverletter' ? 'bg-indigo-500 text-white font-bold' : 'text-gray-400 hover:text-white'}`}
              >
                💌 AI Cover Letter
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleGenerateAIResume}
              disabled={isGeneratingAI}
              className="gap-2 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:opacity-90 text-white font-bold shadow-md shadow-orange-500/20"
            >
              <Sparkles className="w-4 h-4" />
              {isGeneratingAI ? 'Generating AI Resume...' : '✨ Generate AI Resume'}
            </Button>
            <Button 
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-white border-white/20 hover:bg-white/10"
              title="Print or Save as PDF"
            >
              <Printer className="w-4 h-4" /> PDF / Print
            </Button>
            <Button 
              onClick={handleDownloadDoc}
              variant="outline"
              size="sm"
              className="gap-1.5 text-xs text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/10"
              title="Download Word (.doc)"
            >
              <Download className="w-4 h-4" /> Word (.doc)
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              size="sm"
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
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
              View All Saved Resumes & Documents
            </Link>
          </div>
        )}

        {/* Title Input */}
        <div className="no-print">
          <label className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Target Job Role / Resume Title:</label>
          <Input 
            value={resume.title} 
            onChange={e => setResume({...resume, title: e.target.value})}
            className="text-2xl md:text-3xl font-black bg-transparent border-b border-white/20 px-0 rounded-none focus-visible:ring-0 text-white" 
          />
        </div>

        {/* FORM EDITOR TAB */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-2 space-y-6">
              {/* AI Auto-generate Callout Banner inside Form Editor */}
              <div className="p-4 bg-gradient-to-r from-cyan-900/40 to-indigo-900/40 border border-cyan-500/30 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" /> Need a Comprehensive AI Resume?
                  </h4>
                  <p className="text-xs text-gray-300 mt-1">
                    JobHub AI synthesizes your onboarding profile and expands it into an executive-ready resume with quantifiable metrics and tailored bullet points.
                  </p>
                </div>
                <Button
                  onClick={handleGenerateAIResume}
                  disabled={isGeneratingAI}
                  className="bg-cyan-500 hover:bg-cyan-400 text-black font-black text-xs shrink-0 px-4 py-2"
                >
                  {isGeneratingAI ? 'Building...' : '✨ Generate AI Resume'}
                </Button>
              </div>

              {/* Professional Summary */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold flex items-center gap-2 text-cyan-300">
                  <FileText className="w-4 h-4"/> Executive Professional Summary
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
                  <p className="text-xs text-gray-400 italic">No experience entries yet. Click &quot;Add Experience&quot; or &quot;Generate AI Resume&quot; to auto-populate.</p>
                ) : (
                  resume.experience.map((exp: any, i: number) => (
                    <div key={i} className="p-4 bg-black/40 border border-white/10 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <Input 
                          placeholder="Job Title / Role" 
                          value={exp.role || exp.title || ''} 
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
                        value={exp.responsibilities || exp.description || ''} 
                        onChange={e => {
                          const newExp = [...resume.experience];
                          newExp[i] = { ...newExp[i], responsibilities: e.target.value };
                          setResume({ ...resume, experience: newExp });
                        }}
                        rows={3}
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
            
            {/* Sidebar: Candidate Info, Skills, Additional Details */}
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

              {/* Additional Information box for Item 3 & 5 */}
              <div className="space-y-3 bg-white/5 border border-white/10 p-5 rounded-2xl">
                <h3 className="text-base font-bold text-cyan-300 border-b border-white/10 pb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" /> Additional Information
                </h3>
                <p className="text-xs text-gray-400">Add any new achievements, certifications, or custom notes:</p>
                <Textarea 
                  placeholder="e.g. Completed AWS Certified Solutions Architect; Led deployment of scalable microservices in GCP with 99.99% uptime..."
                  rows={4}
                  value={additionalInfo}
                  onChange={e => setAdditionalInfo(e.target.value)}
                  className="bg-black/30 border-white/10 text-white text-xs"
                />
                <Button 
                  onClick={handleGenerateAIResume}
                  disabled={isGeneratingAI}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs gap-2 py-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {isGeneratingAI ? 'Generating...' : 'Generate AI Resume from this'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* COVER LETTER TAB */}
        {activeTab === 'coverletter' && (
          <div className="bg-white/5 border border-white/10 p-6 md:p-8 rounded-2xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-400" /> AI Generated Cover Letter
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Tailored to your profile skills and target role. You can edit, copy, or download it directly as a Word document.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={handleCopyCoverLetter} 
                  variant="outline" 
                  size="sm"
                  className="gap-1.5 text-xs text-white border-white/20 hover:bg-white/10"
                >
                  <Copy className="w-3.5 h-3.5" /> {copiedCoverLetter ? 'Copied!' : 'Copy to Clipboard'}
                </Button>
                <Button 
                  onClick={handleDownloadCoverLetterDoc} 
                  size="sm"
                  className="gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  <Download className="w-3.5 h-3.5" /> Download (.doc)
                </Button>
              </div>
            </div>

            <Textarea 
              value={coverLetter || `Dear Hiring Team,\n\nI am excited to express my interest in the ${resume.title} role. With extensive expertise in ${resume.skills.slice(0, 4).join(', ')}, I bring a proven record of delivering impactful outcomes and driving technical excellence.\n\nThank you for considering my application.\n\nSincerely,\n${resume.personalInfo?.firstName} ${resume.personalInfo?.lastName}`}
              onChange={e => setCoverLetter(e.target.value)}
              rows={16}
              className="w-full bg-black/40 border-white/10 text-white font-serif leading-relaxed text-sm p-4 rounded-xl"
            />
          </div>
        )}

        {/* EXECUTIVE RESUME PREVIEW CONTAINER */}
        <div 
          id="printable-resume" 
          className={`bg-white text-gray-900 p-8 md:p-12 rounded-2xl shadow-2xl space-y-6 ${activeTab === 'editor' ? 'hidden md:block' : activeTab === 'preview' ? 'block' : 'hidden'}`}
          style={{ minHeight: '800px', maxWidth: '850px', margin: '0 auto' }}
        >
          {/* Prominent RESUME Title Required by Item 5 */}
          <div className="text-center pb-2">
            <span className="text-xs font-black tracking-widest text-indigo-700 uppercase bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">
              RESUME
            </span>
          </div>

          {/* Header */}
          <div className="border-b-2 border-gray-900 pb-4 text-center">
            <h1 className="text-3xl font-black uppercase tracking-tight text-gray-900">
              {resume.personalInfo?.firstName} {resume.personalInfo?.lastName}
            </h1>
            <p className="text-base font-bold text-indigo-700 tracking-wide mt-1">
              {resume.title}
            </p>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-2 font-medium">
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
                      <span className="font-bold text-gray-900 text-sm">{exp.role || exp.title}</span>
                      <span className="text-gray-500 italic font-mono">{exp.dates}</span>
                    </div>
                    <div className="text-xs font-semibold text-indigo-700">{exp.company}</div>
                    {(exp.responsibilities || exp.description) && (
                      <p className="text-xs text-gray-700 leading-relaxed font-serif pl-2 border-l-2 border-gray-200 whitespace-pre-line">
                        {exp.responsibilities || exp.description}
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
