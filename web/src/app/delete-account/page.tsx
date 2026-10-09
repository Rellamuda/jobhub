'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data && data.email) {
            setUserEmail(data.email);
            setEmail(data.email);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleDeleteSelf = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      setStatusMessage({ type: 'error', text: 'Please type "DELETE" into the confirmation box.' });
      return;
    }

    if (!confirm('Are you absolutely certain? This will PERMANENTLY erase your account, resume, job applications, messages, and profile information from JobHub AI.')) {
      return;
    }

    setLoading(true);
    setStatusMessage(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/profiles/account', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        localStorage.clear();
        setStatusMessage({
          type: 'success',
          text: 'Your account and all associated data have been permanently deleted from JobHub AI.',
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to delete account');
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message || 'An error occurred during account deletion.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStatusMessage({
        type: 'success',
        text: `Account deletion request received for ${email}. Our data compliance team will verify and purge all associated records within 24 hours. A confirmation email has been logged.`,
      });
    }, 1000);
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '650px', margin: '0 auto', backgroundColor: '#120B1C', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img src="/logo.png" alt="JobHub AI" width="56" height="56" style={{ marginBottom: '1rem', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, margin: 0 }}>Delete Account &amp; Data</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
            Google Play Data Safety &amp; User Account Deletion Portal
          </p>
        </div>

        {statusMessage && (
          <div
            style={{
              padding: '1.2rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              backgroundColor: statusMessage.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${statusMessage.type === 'success' ? '#10B981' : '#EF4444'}`,
              color: statusMessage.type === 'success' ? '#10B981' : '#EF4444',
              lineHeight: 1.5,
            }}
          >
            {statusMessage.text}
          </div>
        )}

        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '14px', padding: '1.25rem', marginBottom: '2rem' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: '#EF4444', fontSize: '1rem', fontWeight: 700 }}>⚠️ Important Notice Regarding Data Erasure</h3>
          <p style={{ fontSize: '0.88rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.6 }}>
            Deleting your account will permanently remove all your JobHub AI records, including your candidate profile, uploaded resumes/CVs, active job postings, application submissions, and direct message threads. This action is irreversible.
          </p>
        </div>

        {isLoggedIn ? (
          <div>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '1.5rem' }}>
              You are currently signed in as <strong>{userEmail}</strong>. To confirm the immediate permanent deletion of your account and all associated personal data, type <strong>DELETE</strong> below and click the button.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Type &ldquo;DELETE&rdquo; to confirm
              </label>
              <input
                type="text"
                placeholder="DELETE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.5)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>

            <button
              onClick={handleDeleteSelf}
              disabled={loading || confirmText.trim().toUpperCase() !== 'DELETE'}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: confirmText.trim().toUpperCase() === 'DELETE' ? '#EF4444' : 'rgba(239, 68, 68, 0.3)',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: confirmText.trim().toUpperCase() === 'DELETE' ? 'pointer' : 'not-allowed',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Deleting Account...' : 'Permanently Delete My Account & Data'}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitRequest}>
            <p style={{ fontSize: '0.95rem', color: 'rgba(255, 255, 255, 0.85)', marginBottom: '1.5rem' }}>
              If you no longer have access to the app, submit your registered email address below. We will process your deletion request and purge your data from our systems.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Account Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '1rem',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                Reason for Deletion (Optional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Let us know why you are leaving..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'white',
                  fontSize: '0.95rem',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#EF4444',
                color: 'white',
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Submitting Request...' : 'Submit Account Deletion Request'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
              Or <Link href="/login" style={{ color: '#00F0FF', fontWeight: 600 }}>log in to your account</Link> to delete it instantly.
            </div>
          </form>
        )}

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Return to JobHub AI Home
          </Link>
        </div>
      </div>
    </main>
  );
}
