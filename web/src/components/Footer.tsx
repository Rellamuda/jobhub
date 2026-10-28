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

      {/* Share App on Social Media Bar (Facebook, Instagram, TikTok, YouTube, WhatsApp) */}
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto 2rem',
        padding: '1.25rem 1.5rem',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(0, 240, 255, 0.18)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.98rem' }}>
            🚀 Share JobHub Global on Social Media
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
            Invite friends, colleagues, and employers across your favorite platforms
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Facebook */}
          <a
            href="https://www.facebook.com/sharer/sharer.php?u=https%3A%2F%2Fjobhub-app.duckdns.org"
            target="_blank"
            rel="noopener noreferrer"
            title="Share on Facebook"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#1877F2',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
            Facebook
          </a>

          {/* WhatsApp */}
          <a
            href="https://api.whatsapp.com/send?text=Check%20out%20JobHub%20Global%20-%20AI-powered%20job%20matching%2C%20instant%20resumes%2C%20and%20global%20hiring!%20https%3A%2F%2Fjobhub-app.duckdns.org"
            target="_blank"
            rel="noopener noreferrer"
            title="Share on WhatsApp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#25D366',
              color: '#fff',
              textDecoration: 'none',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.95-1.27-4.88-4.25-5.03-4.45-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.82 2.01.89 2.16.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.26 1.64 2.04 1.13 1.01 2.08 1.32 2.38 1.47.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.49.22.57.35.07.12.07.72-.17 1.4z"/></svg>
            WhatsApp
          </a>

          {/* Instagram */}
          <button
            type="button"
            onClick={async () => {
              const shareText = 'Discover JobHub Global — AI Resume Builder & Autonomous Job Matching: https://jobhub-app.duckdns.org';
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'JobHub Global', text: shareText, url: 'https://jobhub-app.duckdns.org' });
                  return;
                } catch {}
              }
              await navigator.clipboard.writeText(shareText);
              window.open('https://www.instagram.com/', '_blank', 'noopener,noreferrer');
            }}
            title="Share on Instagram"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
            Instagram
          </button>

          {/* TikTok */}
          <button
            type="button"
            onClick={async () => {
              const shareText = 'Check out JobHub Global — AI Resume Builder & Autonomous Job Matching: https://jobhub-app.duckdns.org';
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'JobHub Global', text: shareText, url: 'https://jobhub-app.duckdns.org' });
                  return;
                } catch {}
              }
              await navigator.clipboard.writeText(shareText);
              window.open('https://www.tiktok.com/', '_blank', 'noopener,noreferrer');
            }}
            title="Share on TikTok"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#111111',
              border: '1px solid #00f0ff',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            TikTok
          </button>

          {/* YouTube */}
          <button
            type="button"
            onClick={async () => {
              const shareText = 'Explore JobHub Global — AI Resume Builder & Global Job Matching: https://jobhub-app.duckdns.org';
              if (navigator.share) {
                try {
                  await navigator.share({ title: 'JobHub Global', text: shareText, url: 'https://jobhub-app.duckdns.org' });
                  return;
                } catch {}
              }
              await navigator.clipboard.writeText(shareText);
              window.open('https://www.youtube.com/', '_blank', 'noopener,noreferrer');
            }}
            title="Share on YouTube"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#FF0000',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.8rem',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/></svg>
            YouTube
          </button>
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
