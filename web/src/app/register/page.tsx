'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JOB_SEEKER'); // JOB_SEEKER or EMPLOYER
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
      });

      if (!res.ok) {
        let errMsg = 'Registration failed. Please try again.';
        try {
          const errData = await res.json();
          if (errData && errData.message) {
            errMsg = errData.message;
          }
        } catch (_) {
          if (res.status >= 500) {
            errMsg = 'Server connection error. Please try again later.';
          }
        }
        throw new Error(errMsg);
      }

      // Redirect to login page for sign in
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
          Join <span className="text-gradient">JobHub AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Create an account to start your journey (v2)
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4d4d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>I am a...</label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button 
                type="button"
                onClick={() => setRole('JOB_SEEKER')}
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: role === 'JOB_SEEKER' ? '2px solid var(--primary-color)' : '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: role === 'JOB_SEEKER' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: 'white', cursor: 'pointer', fontWeight: role === 'JOB_SEEKER' ? 'bold' : 'normal' }}
              >
                Job Seeker
              </button>
              <button 
                type="button"
                onClick={() => setRole('EMPLOYER')}
                style={{ flex: 1, padding: '1rem', borderRadius: '12px', border: role === 'EMPLOYER' ? '2px solid var(--secondary-color)' : '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: role === 'EMPLOYER' ? 'rgba(0, 240, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)', color: 'white', cursor: 'pointer', fontWeight: role === 'EMPLOYER' ? 'bold' : 'normal' }}
              >
                Employer
              </button>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
              placeholder="hello@jobhub.ai"
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
