'use client';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles } from 'lucide-react';

export default function CreateJobPage() {
  const [prompt, setPrompt] = useState('We need a Flutter developer.');
  const [loading, setLoading] = useState(false);
  const [jd, setJd] = useState<any>(null);

  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const generateJD = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in first.');
        return;
      }
      const res = await fetch('/api/ai/job-description/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.message || 'Failed to generate job description.');
        return;
      }
      const data = await res.json();
      setJd(data);
    } catch (e: any) {
      console.error(e);
      setError('Connection error generating description.');
    } finally {
      setLoading(false);
    }
  };

  const publishJob = async () => {
    if (!jd) return;
    setPublishing(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: jd.title || prompt,
          description: jd.description || '',
          location: 'Remote',
          salary: '$100k - $140k',
          isRemote: true
        })
      });
      if (res.ok) {
        setSuccess('Job published successfully! Redirecting to jobs...');
        setTimeout(() => {
          window.location.href = '/jobs';
        }, 1200);
      } else {
        const errJson = await res.json().catch(() => ({}));
        setError(errJson.message || 'Failed to publish job.');
      }
    } catch (e: any) {
      setError('Error publishing job.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Create New Job</h1>
        <p className="text-gray-500 mt-2">Use our AI to instantly generate a comprehensive job description.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium text-sm">
          {success}
        </div>
      )}

      <Card className="border-indigo-100 dark:border-white/10 border-2">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <Input 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              placeholder="e.g. We need a senior Flutter developer with Firebase experience..." 
              className="flex-1"
            />
            <Button onClick={generateJD} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Autofill with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <label className="font-bold text-gray-700 dark:text-gray-200">Job Title</label>
          <Input 
            value={jd?.title || ''} 
            onChange={e => setJd({ ...jd, title: e.target.value })} 
            className="mt-1 bg-gray-50 dark:bg-white/5" 
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 dark:text-gray-200">Description</label>
          <Textarea 
            value={jd?.description || ''} 
            onChange={e => setJd({ ...jd, description: e.target.value })} 
            rows={4} 
            className="mt-1 bg-gray-50 dark:bg-white/5" 
          />
        </div>

        {jd && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Responsibilities</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  {(jd.responsibilities || []).map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Qualifications & Skills</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {(jd.qualifications || []).map((q: string, i: number) => <li key={i}>{q}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {(jd.requiredSkills || []).map((s: string) => (
                    <span key={s} className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded font-medium">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Button 
          onClick={publishJob} 
          className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" 
          size="lg" 
          disabled={!jd || publishing}
        >
          {publishing ? 'Publishing...' : 'Publish Job Posting'}
        </Button>
      </div>
    </div>
  );
}
