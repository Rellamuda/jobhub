'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Upload, FileText, Download, Mail, ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

export default function ResumesPage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoverLetter, setSelectedCoverLetter] = useState<string | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    // Role Guard: Only Job Seekers are allowed on Resumes page
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

    fetch('/api/resumes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setResumes(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await fetch('/api/resumes/parse', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      window.location.href = `/dashboard/resumes/builder?parsedData=${encodeURIComponent(JSON.stringify(data))}`;
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPdf = async (id: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/resumes/${id}/export/pdf`, { 
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('PDF export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_RESUME.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      // Fallback: direct window print navigation
      window.open(`/dashboard/resumes/builder?id=${id}`, '_blank');
    }
  };

  const handleExportWord = async (id: string, title: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/resumes/${id}/export/word`, { 
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Word export failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_RESUME.doc`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/seeker-dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-gray-400 hover:text-white px-0">
                <ArrowLeft className="w-4 h-4" /> Back to Dashboard
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white flex items-center gap-3">
            📁 Saved Resumes & Documents
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Access, download, and manage your AI-generated resumes and tailored cover letters in one central hub.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <label className="cursor-pointer">
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            <span className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-semibold transition-colors border border-white/10">
              <Upload className="w-4 h-4 text-cyan-400" /> Import PDF
            </span>
          </label>
          <Link href="/dashboard/resumes/builder">
            <Button className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 text-black font-bold rounded-xl">
              <Plus className="w-4 h-4" /> Create New AI Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Info notice about accessing saved docs */}
      <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center gap-3 text-indigo-200 text-sm">
        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
        <div>
          <strong className="text-white">Central Document Repository:</strong> Every resume and cover letter created is permanently preserved here in your dashboard. You can print, download PDF, or export Word (.doc) anytime.
        </div>
      </div>
      
      {/* Resumes Grid */}
      {loading ? (
        <div className="py-20 text-center text-gray-400">Loading your saved documents...</div>
      ) : resumes.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed rounded-2xl border-white/10 bg-white/[0.02] p-8">
          <FileText className="w-16 h-16 text-cyan-400/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white">No saved resumes found yet</h3>
          <p className="text-gray-400 max-w-md mx-auto mt-2 mb-6 text-sm">
            Your profile details from onboarding are ready! Click &quot;Create New AI Resume&quot; to automatically build your executive resume in seconds.
          </p>
          <Link href="/dashboard/resumes/builder">
            <Button className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold">
              ✨ Build My First AI Resume
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resumes.map((resume: any) => (
            <Card key={resume.id} className="bg-white/5 border-white/10 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
              <CardHeader>
                <div className="text-[10px] uppercase font-bold tracking-widest text-cyan-400 mb-1">
                  RESUME • JOBHUB VERIFIED
                </div>
                <CardTitle className="text-lg font-bold text-white line-clamp-1">
                  {resume.title || 'Executive Resume'}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(resume.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-gray-300 line-clamp-3">
                  {resume.summary || 'Executive resume prepared with verified skills and experience.'}
                </p>
                {resume.coverLetter && (
                  <div className="p-2.5 bg-black/40 border border-white/10 rounded-lg">
                    <div className="text-[11px] font-bold text-indigo-300 flex items-center justify-between">
                      <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Attached Cover Letter</span>
                      <button 
                        onClick={() => setSelectedCoverLetter(resume.coverLetter)}
                        className="text-cyan-400 hover:underline text-[11px]"
                      >
                        Read
                      </button>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex gap-2 pt-2 border-t border-white/10 flex-wrap">
                <Link href={`/dashboard/resumes/builder?id=${resume.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full text-xs text-white border-white/20 hover:bg-white/10">
                    Edit
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleExportPdf(resume.id, resume.title || 'Resume')} 
                  title="Download PDF"
                  className="bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> PDF
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => handleExportWord(resume.id, resume.title || 'Resume')} 
                  title="Download Word (.doc)"
                  className="bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-bold"
                >
                  <Download className="w-3.5 h-3.5 mr-1" /> DOC
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Cover Letter Modal */}
      {selectedCoverLetter && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#120B1C] border border-white/20 rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-indigo-400" /> Attached AI Cover Letter
              </h3>
              <button 
                onClick={() => setSelectedCoverLetter(null)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 bg-black/40 rounded-xl text-gray-200 text-sm whitespace-pre-line leading-relaxed font-serif">
              {selectedCoverLetter}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(selectedCoverLetter);
                  alert('Cover letter copied to clipboard!');
                }}
                variant="outline"
                size="sm"
                className="text-white border-white/20"
              >
                Copy Text
              </Button>
              <Button 
                onClick={() => setSelectedCoverLetter(null)}
                size="sm"
                className="bg-cyan-500 text-black font-bold"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
