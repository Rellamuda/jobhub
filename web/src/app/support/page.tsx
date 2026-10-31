'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LifeBuoy, Mail, MessageSquare, CheckCircle, HelpCircle } from 'lucide-react';

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('General Inquiry');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.id) {
            setUserId(data.id);
            if (data.email) setEmail(data.email);
            if (data.jobSeekerProfile) {
              setName(`${data.jobSeekerProfile.firstName || ''} ${data.jobSeekerProfile.lastName || ''}`.trim());
            } else if (data.employer) {
              setName(data.employer.companyName || '');
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/support-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId || undefined,
          name: name.trim() || 'JobHub User',
          email: email.trim(),
          category,
          subject: subject.trim(),
          message: message.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMessage(data.message || 'Failed to submit inquiry. Please try again.');
      }
    } catch {
      setErrorMessage('Network error occurred while submitting inquiry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '3.5rem 1.5rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header Banner */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.6rem',
            background: 'rgba(0, 240, 255, 0.1)',
            border: '1px solid rgba(0, 240, 255, 0.3)',
            padding: '0.4rem 1.2rem',
            borderRadius: '20px',
            color: '#00F0FF',
            fontSize: '0.9rem',
            fontWeight: 600,
            marginBottom: '1rem',
          }}>
            <LifeBuoy style={{ width: 18, height: 18 }} /> JobHub Help &amp; Support Desk
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: '0 0 0.75rem 0' }}>
            Support &amp; Enquiries
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.65)', maxWidth: '600px', margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
            Have a question about JobHub Global, job applications, employer recruitment, or billing? Submit your ticket and our administrative team will assist you.
          </p>
        </div>

        {submitted ? (
          <div style={{
            backgroundColor: '#120B1C',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            borderRadius: '20px',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <CheckCircle style={{ width: 64, height: 64, color: '#10B981', margin: '0 auto 1.5rem auto' }} />
            <h2 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.75rem', color: '#10B981' }}>
              Inquiry Submitted Successfully!
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', fontSize: '1.05rem', maxWidth: '520px', margin: '0 auto 2rem auto', lineHeight: 1.6 }}>
              Thank you for contacting JobHub Global. Your inquiry has been routed directly to our admin team. We will review your request and get back to you promptly at <strong>{email}</strong>.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setSubject('');
                  setMessage('');
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Submit Another Inquiry
              </button>
              <Link
                href="/"
                style={{
                  background: '#00F0FF',
                  color: 'black',
                  padding: '0.75rem 1.75rem',
                  borderRadius: '10px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Return to Home
              </Link>
            </div>
          </div>
        ) : (
          <div style={{
            backgroundColor: '#120B1C',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '2.5rem',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            {errorMessage && (
              <div style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid #EF4444',
                color: '#F87171',
                padding: '1rem',
                borderRadius: '10px',
                marginBottom: '1.5rem',
                fontSize: '0.95rem',
              }}>
                ⚠ {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Your Full Name / Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe / Acme Corp"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Inquiry Category *
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', backgroundColor: '#1C122C', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Account / Profile Issue">Account / Profile Issue</option>
                  <option value="Subscription & Billing">Subscription &amp; Billing</option>
                  <option value="Job Posting / Applications">Job Posting / Applications</option>
                  <option value="Verification Request">Verification Request</option>
                  <option value="Technical Issue / Bug">Technical Issue / Bug</option>
                  <option value="Partnership / Enterprise">Partnership / Enterprise</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Summary of your question or issue"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Message Details *
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Explain your inquiry in detail. Include any relevant links, job titles, or dates..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', padding: '0.8rem 1rem', borderRadius: '10px', backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', color: 'white', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.5)' }}>
                  Operated by CleanConnect Nigeria (<a href="mailto:cleanconnectng@gmail.com" style={{ color: '#00F0FF' }}>cleanconnectng@gmail.com</a>)
                </p>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    background: '#00F0FF',
                    color: 'black',
                    border: 'none',
                    padding: '0.85rem 2rem',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 15px rgba(0, 240, 255, 0.3)',
                  }}
                >
                  {isSubmitting ? 'Submitting Ticket...' : 'Send Inquiry to Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Return to JobHub Global Home
          </Link>
        </div>
      </div>
    </main>
  );
}
