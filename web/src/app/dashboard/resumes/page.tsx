'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Plus, Upload, FileText, Download } from 'lucide-react';

export default function ResumesPage() {
  const [resumes, setResumes] = useState([]);
  
  useEffect(() => {
    fetch('/api/resumes')
      .then(res => res.json())
      .then(data => setResumes(data))
      .catch(err => console.error(err));
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
      // Navigate to builder with parsed data
      window.location.href = `/dashboard/resumes/builder?parsedData=${encodeURIComponent(JSON.stringify(data))}`;
    } catch (err) {
      console.error(err);
    }
  };

  const handleExport = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}/export/pdf`, { method: 'POST' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportWord = async (id: string) => {
    try {
      const res = await fetch(`/api/resumes/${id}/export/word`, { method: 'POST' });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'resume.doc';
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">My Resumes</h1>
          <p className="text-gray-500 mt-2">Manage and tailor your CVs for different applications.</p>
        </div>
        <div className="flex gap-4">
          <label className="cursor-pointer">
            <input type="file" accept="application/pdf" className="hidden" onChange={handleUpload} />
            <span className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-md shadow-sm text-sm font-medium transition-colors">
              <Upload className="w-4 h-4" /> Import PDF
            </span>
          </label>
          <Link href="/dashboard/resumes/builder">
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Create New
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resumes.length === 0 ? (
          <div className="col-span-full py-20 text-center border-2 border-dashed rounded-xl border-gray-200 dark:border-gray-800">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No resumes found</h3>
            <p className="text-gray-500 mb-6">Create your first professional CV or import an existing PDF.</p>
          </div>
        ) : (
          resumes.map((resume: any) => (
            <Card key={resume.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex justify-between items-center text-lg">
                  {resume.title}
                  {resume.atsScore && (
                    <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      ATS: {resume.atsScore}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 line-clamp-2">{resume.summary || 'No summary provided.'}</p>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Link href={`/dashboard/resumes/builder?id=${resume.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">Edit</Button>
                </Link>
                <Button variant="secondary" size="icon" onClick={() => handleExport(resume.id)} title="Export PDF">
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>PDF</span>
                </Button>
                <Button variant="secondary" size="icon" onClick={() => handleExportWord(resume.id)} title="Export Word">
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>DOC</span>
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
