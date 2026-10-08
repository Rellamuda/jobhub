'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, FileText, RefreshCw } from 'lucide-react';

function ResumeBuilder() {
  const searchParams = useSearchParams();
  const resumeId = searchParams.get('id');
  const parsedDataParam = searchParams.get('parsedData');
  
  const [resume, setResume] = useState({
    title: 'Untitled Resume',
    summary: '',
    personalInfo: { firstName: '', lastName: '', email: '', phone: '', city: '' },
    experience: [] as any[],
    education: [] as any[],
    skills: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);

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
      // Automatically pull onboarding profile data so user does not re-fill from scratch
      fetch('/api/profiles/job-seeker', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(prof => {
          if (prof) {
            setResume(prev => ({
              ...prev,
              title: `${prof.firstName || ''} ${prof.lastName || ''} - ${prof.desiredJobTitle || prof.profession || 'Resume'}`.trim(),
              summary: prof.summary || prof.headline || '',
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
      alert('Saved successfully!');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAtsOptimize = async () => {
    const jobDescription = prompt("Paste the target job description:");
    if (!jobDescription) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/resumes/${resumeId}/ats-optimize`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ jobDescription })
      });
      const data = await res.json();
      setResume(prev => ({ ...prev, ...data.optimizedResume }));
      alert(`Optimized! New ATS Score estimate: ${data.score}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <Input 
            value={resume.title} 
            onChange={e => setResume({...resume, title: e.target.value})}
            className="text-3xl font-bold border-none shadow-none px-0 focus-visible:ring-0" 
          />
        </div>
        <div className="flex gap-4">
          {resumeId && (
            <Button variant="outline" onClick={handleAtsOptimize} className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50">
              <RefreshCw className="w-4 h-4" /> Optimize for Job
            </Button>
          )}
          <Button onClick={handleSave} disabled={isSaving} className="gap-2">
            <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save CV'}
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="col-span-2 space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><FileText className="w-4 h-4"/> Professional Summary</h3>
            <Textarea 
              value={resume.summary} 
              onChange={e => setResume({...resume, summary: e.target.value})}
              rows={5} 
              placeholder="A brief summary of your professional background..." 
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><FileText className="w-4 h-4"/> Experience</h3>
            <p className="text-sm text-gray-500">Edit experience JSON (Raw view for demo purposes):</p>
            <Textarea 
              value={JSON.stringify(resume.experience, null, 2)} 
              onChange={e => {
                try {
                  setResume({...resume, experience: JSON.parse(e.target.value)});
                } catch(err) {}
              }}
              rows={8}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold flex items-center gap-2 border-b pb-2"><FileText className="w-4 h-4"/> Education</h3>
            <p className="text-sm text-gray-500">Edit education JSON (Raw view for demo purposes):</p>
            <Textarea 
              value={JSON.stringify(resume.education, null, 2)} 
              onChange={e => {
                try {
                  setResume({...resume, education: JSON.parse(e.target.value)});
                } catch(err) {}
              }}
              rows={6}
            />
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">Personal Info</h3>
            <Input 
              placeholder="First Name" 
              value={resume.personalInfo?.firstName || ''} 
              onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, firstName: e.target.value}})}
            />
            <Input 
              placeholder="Last Name" 
              value={resume.personalInfo?.lastName || ''} 
              onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, lastName: e.target.value}})}
            />
            <Input 
              placeholder="Email" 
              value={resume.personalInfo?.email || ''} 
              onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, email: e.target.value}})}
            />
            <Input 
              placeholder="Phone" 
              value={resume.personalInfo?.phone || ''} 
              onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, phone: e.target.value}})}
            />
            <Input 
              placeholder="City / Town" 
              value={resume.personalInfo?.city || ''} 
              onChange={e => setResume({...resume, personalInfo: {...resume.personalInfo, city: e.target.value}})}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold border-b pb-2">Skills</h3>
            <p className="text-xs text-gray-500">Comma-separated list (e.g. React, Node.js, Python)</p>
            <Input 
              placeholder="Skills (comma separated)" 
              value={Array.isArray(resume.skills) ? resume.skills.join(', ') : ''} 
              onChange={e => setResume({...resume, skills: e.target.value.split(',').map(s => s.trim())})}
            />
          </div>

          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold border-b pb-2 text-indigo-600 dark:text-cyan-400">✨ Additional Information</h3>
            <p className="text-xs text-gray-500">Add any new projects, awards, or details to include in this generated resume:</p>
            <Textarea 
              placeholder="e.g. Recently completed AWS Certified Cloud Practitioner. Led a team of 4 in an AI hackathon..."
              rows={4}
              onChange={e => {
                const addVal = e.target.value;
                setResume(prev => ({
                  ...prev,
                  summary: prev.summary.includes('\n\nAdditional Highlights:') 
                    ? prev.summary.split('\n\nAdditional Highlights:')[0] + (addVal ? `\n\nAdditional Highlights: ${addVal}` : '')
                    : prev.summary + (addVal ? `\n\nAdditional Highlights: ${addVal}` : '')
                }));
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResumeBuilderPage() {
  return (
    <Suspense fallback={<div className="p-8 max-w-5xl mx-auto">Loading builder...</div>}>
      <ResumeBuilder />
    </Suspense>
  );
}
