'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState<'REGISTER' | 'VERIFY'>('REGISTER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('JOB_SEEKER'); // JOB_SEEKER or EMPLOYER
  const [rememberCredentials, setRememberCredentials] = useState(true);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, role }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        let errMsg = data?.message || 'Registration failed. Please try again.';
        if (res.status >= 500) {
          errMsg = 'Server connection error. Please try again later.';
        }
        throw new Error(errMsg);
      }

      // Save credentials if Remember is checked
      if (rememberCredentials) {
        localStorage.setItem('remember_credentials', 'true');
        localStorage.setItem('saved_email', cleanEmail);
        localStorage.setItem('saved_password', password);
      }

      // Switch to 6-digit verification code step
      setStep('VERIFY');
      setResendCooldown(30);
      setSuccessMsg(`A 6-digit verification code has been sent to ${cleanEmail}. Please enter it below to activate your account.`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = verificationCode.trim();
    if (cleanCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code: cleanCode }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.message || 'Invalid verification code. Please check your email and try again.');
      }

      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
      }

      setSuccessMsg('Email verified successfully! Redirecting to complete your profile...');
      setTimeout(() => {
        window.location.href = '/onboarding';
      }, 1000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError('');
    setSuccessMsg('');

    try {
      const cleanEmail = email.trim().toLowerCase();
      const res = await fetch('/api/auth/resend-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.message || 'Failed to resend code.');
      }

      setSuccessMsg(`A new 6-digit code has been sent to ${cleanEmail}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsResending(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '3rem 2rem' }}>
        {step === 'REGISTER' ? (
          <>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, textAlign: 'center', marginBottom: '0.5rem' }}>
              Join <span className="text-gradient">JobHub</span>
            </h1>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '2rem' }}>
              Create an account to start your journey
            </p>

            {successMsg && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.9rem', lineHeight: 1.5 }}>
                {successMsg}
              </div>
            )}

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
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '1rem', paddingRight: '3rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', backgroundColor: 'rgba(255, 255, 255, 0.05)', color: 'white', fontSize: '1rem', outline: 'none' }}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      right: '1rem',
                      background: 'none',
                      border: 'none',
                      color: 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      padding: '0.25rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {showPassword ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '-0.25rem' }}>
                <input 
                  type="checkbox" 
                  id="rememberRegisterCredentials"
                  checked={rememberCredentials}
                  onChange={(e) => setRememberCredentials(e.target.checked)}
                  style={{
                    accentColor: '#00F0FF',
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                  }}
                />
                <label 
                  htmlFor="rememberRegisterCredentials"
                  style={{
                    color: 'rgba(255, 255, 255, 0.85)',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontWeight: 500,
                  }}
                >
                  Remember Email & Password
                </label>
              </div>

              <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)' }}>
              Already have an account?{' '}
              <Link href="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 'bold' }}>
                Sign in
              </Link>
            </p>
          </>
        ) : (
          <>
            {/* Step: VERIFY 6-DIGIT CODE */}
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                margin: '0 auto 1.25rem auto',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366F1, #00F0FF)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 240, 255, 0.35)',
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                Verify Your <span className="text-gradient">Email</span>
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.5 }}>
                We sent a 6-digit confirmation code to:
              </p>
              <p style={{ color: '#00F0FF', fontWeight: 700, fontSize: '1rem', marginTop: '0.25rem' }}>
                {email}
              </p>
            </div>

            {successMsg && (
              <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#34d399', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem', lineHeight: 1.5 }}>
                {successMsg}
              </div>
            )}

            {error && (
              <div style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)', border: '1px solid red', color: '#ff4d4d', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.875rem' }}>
                  Enter 6-digit verification code:
                </label>
                <input 
                  type="text" 
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  maxLength={6}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '1.1rem',
                    borderRadius: '12px',
                    border: '2px solid rgba(0, 240, 255, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    color: '#00F0FF',
                    fontSize: '2rem',
                    fontWeight: 800,
                    textAlign: 'center',
                    letterSpacing: '12px',
                    fontFamily: 'monospace',
                    outline: 'none',
                    boxShadow: '0 0 15px rgba(0, 240, 255, 0.2)',
                  }}
                  placeholder="••••••"
                />
                <p style={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.45)', fontSize: '0.78rem', marginTop: '0.5rem' }}>
                  ⏱️ Code is valid for 15 minutes. Check spam/junk if not found.
                </p>
              </div>

              <button type="submit" className="btn-primary" disabled={loading || verificationCode.length !== 6} style={{ marginTop: '0.5rem' }}>
                {loading ? 'Verifying...' : 'Verify & Continue to Onboarding'}
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.5rem', textAlign: 'center', fontSize: '0.875rem' }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Didn't receive code? </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.4)' : '#00F0FF',
                    fontWeight: 700,
                    cursor: resendCooldown > 0 ? 'default' : 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (isResending ? 'Sending...' : 'Resend Code')}
                </button>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => {
                    setStep('REGISTER');
                    setError('');
                    setSuccessMsg('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    fontSize: '0.825rem',
                  }}
                >
                  ← Wrong email? Back to Registration
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
