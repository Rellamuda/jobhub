'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateJobPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [salary, setSalary] = useState('');
  const [isRemote, setIsRemote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  const handleGenerateAiDescription = async () => {
    if (!title) {
      setError('Please enter a Job Title first to generate a description.');
      return;
    }
    setGeneratingAi(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/ai/job-description/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          location,
          isRemote,
          salary
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setDescription(data.description);
      } else {
        setError('Failed to generate description.');
      }
    } catch (err: any) {
      setError('Failed to generate description.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You must be logged in as an Employer to post a job.');
      }

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          location,
          salary,
          isRemote
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Failed to create job');
      }

      router.push('/jobs');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '600px', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
          Post a <span className="text-gradient">New Job</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Find the perfect AI talent for your team
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4d4d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Job Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
              placeholder="e.g. Senior AI Engineer"
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ display: 'block', color: 'var(--text-secondary)' }}>Job Description</label>
              <button 
                type="button" 
                onClick={handleGenerateAiDescription} 
                disabled={generatingAi}
                style={{ background: 'transparent', border: '1px solid #00f0ff', color: '#00f0ff', padding: '4px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.9rem' }}
              >
                {generatingAi ? 'Generating...' : '✨ Generate with AI'}
              </button>
            </div>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={5}
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
              placeholder="Describe the responsibilities, requirements, and benefits..."
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Location</label>
              <input 
                type="text" 
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Salary Range</label>
              <input 
                type="text" 
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
                placeholder="e.g. $120k - $150k"
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              style={{ width: '20px', height: '20px', cursor: 'pointer' }}
            />
            <span style={{ color: 'white', fontSize: '1.1rem' }}>This is a remote position</span>
          </label>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Posting Job...' : 'Post Job'}
          </button>
        </form>
      </div>
    </main>
  );
}
