'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        let errMsg = 'Invalid email or password';
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

      const data = await res.json();
      localStorage.setItem('token', data.access_token);
      
      // Actively check if user has completed their profile
      const role = data.user?.role;
      const profileEndpoint = role === 'EMPLOYER' ? '/profiles/employer' : '/profiles/job-seeker';
      try {
        const profileRes = await fetch(`/api${profileEndpoint}`, {
          headers: { 'Authorization': `Bearer ${data.access_token}` }
        });
        if (profileRes.ok) {
          const profile = await profileRes.json();
          const hasProfile = role === 'EMPLOYER'
            ? (profile && profile.companyName && profile.companyName.length > 0)
            : (profile && profile.firstName && profile.firstName.length > 0);
          if (hasProfile) {
            if (role === 'EMPLOYER') {
              window.location.href = '/applications';
            } else {
              window.location.href = '/seeker-dashboard';
            }
            return;
          }
        }
      } catch (profileErr) {
        // If profile check fails, send to onboarding page to be safe
      }
      // No profile found or check failed — send to complete profile
      window.location.href = '/onboarding';
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
          Welcome back to <span className="text-gradient">JobHub AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
          Sign in to access your AI employment portal
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4d4d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
