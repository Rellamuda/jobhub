'use client';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      backgroundColor: '#07070a',
      color: '#94a3b8',
      padding: '3rem 2rem 2rem',
      fontSize: '0.9rem',
      marginTop: 'auto',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '2rem',
        marginBottom: '2.5rem',
      }}>
        {/* Brand */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
            <img src="/logo.png" alt="JobHub AI" width="32" height="32" style={{ objectFit: 'contain' }} />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
              JobHub<span style={{ color: '#00f0ff' }}>.ai</span>
            </span>
          </div>
          <p style={{ margin: 0, lineHeight: 1.6, fontSize: '0.85rem', color: '#64748b' }}>
            Empowering job seekers and employers with autonomous matching, verified resumes, and smart career discovery.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Explore Platform</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/jobs" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                Browse Jobs
              </Link>
            </li>
            <li>
              <Link href="/pricing" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                Subscription Plans
              </Link>
            </li>
            <li>
              <Link href="/register" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                Create Account
              </Link>
            </li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Legal & Privacy</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/delete-account" style={{ color: '#f87171', textDecoration: 'none' }}>
                Delete Account & Data
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Assistance</h4>
          <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: '#64748b' }}>
            Questions or inquiries?
          </p>
          <a
            href="mailto:support@jobhubai.com"
            style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}
          >
            support@jobhubai.com
          </a>
        </div>
      </div>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        paddingTop: '1.5rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        fontSize: '0.8rem',
        color: '#64748b',
      }}>
        <span>&copy; {new Date().getFullYear()} JobHub AI. All rights reserved.</span>
        <span>Secure &amp; Verified Recruitment Ecosystem</span>
      </div>
    </footer>
  );
}
