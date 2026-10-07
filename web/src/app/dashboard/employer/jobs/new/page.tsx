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

  const generateJD = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/job-description/generate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      setJd(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Create New Job</h1>
        <p className="text-gray-500 mt-2">Use our AI to instantly generate a comprehensive job description.</p>
      </div>

      <Card className="border-indigo-100 border-2">
        <CardContent className="p-6 space-y-4">
          <div className="flex gap-4">
            <Input 
              value={prompt} 
              onChange={e => setPrompt(e.target.value)} 
              placeholder="e.g. We need a senior Flutter developer with Firebase experience..." 
              className="flex-1"
            />
            <Button onClick={generateJD} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
              <Sparkles className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Autofill with AI'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <div>
          <label className="font-bold text-gray-700">Job Title</label>
          <Input value={jd?.title || ''} readOnly className="mt-1 bg-gray-50" />
        </div>

        <div>
          <label className="font-bold text-gray-700">Description</label>
          <Textarea value={jd?.description || ''} readOnly rows={4} className="mt-1 bg-gray-50" />
        </div>

        {jd && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Responsibilities</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {jd.responsibilities.map((r: string, i: number) => <li key={i}>{r}</li>)}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-lg">Qualifications & Skills</CardTitle></CardHeader>
              <CardContent>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-4">
                  {jd.qualifications.map((q: string, i: number) => <li key={i}>{q}</li>)}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {jd.requiredSkills.map((s: string) => (
                    <span key={s} className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded">{s}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        
        <Button className="w-full mt-4" size="lg" disabled={!jd}>Publish Job Posting</Button>
      </div>
    </div>
  );
}
