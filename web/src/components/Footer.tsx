'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [channelNotice, setChannelNotice] = useState<string | null>(null);

  const handleChannelClick = (channelName: string) => {
    setChannelNotice(`We are still creating our official ${channelName} page, but not yet ready. It will be available shortly!`);
  };

  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      backgroundColor: '#07070a',
      color: '#94a3b8',
      padding: '3rem 2rem 2rem',
      fontSize: '0.9rem',
      marginTop: 'auto',
    }}>
      {channelNotice && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.78)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1.25rem',
          }}
          onClick={() => setChannelNotice(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #120B1C 0%, #1A102E 100%)',
              border: '1px solid rgba(0, 240, 255, 0.45)',
              borderRadius: '20px',
              padding: '2.25rem 2rem',
              maxWidth: '460px',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(0, 240, 255, 0.25)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '2.8rem', marginBottom: '0.75rem' }}>🚀</div>
            <h3 style={{ color: '#fff', fontSize: '1.35rem', fontWeight: 800, margin: '0 0 0.6rem 0' }}>
              Page Under Construction
            </h3>
            <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: 1.6, margin: '0 0 1.75rem 0' }}>
              {channelNotice}
            </p>
            <button
              onClick={() => setChannelNotice(null)}
              style={{
                background: 'linear-gradient(135deg, #00F0FF 0%, #0080FF 100%)',
                color: '#000',
                fontWeight: 800,
                fontSize: '0.92rem',
                padding: '0.8rem 2.25rem',
                borderRadius: '999px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 18px rgba(0, 240, 255, 0.35)',
                transition: 'transform 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Understood
            </button>
          </div>
        </div>
      )}

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
            <img
              src="/header-logo.png"
              alt="JobHub Global"
              width="36"
              height="36"
              style={{ width: '36px', height: '36px', objectFit: 'contain', borderRadius: '8px' }}
            />
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', letterSpacing: '0.5px' }}>
              JobHub <span style={{ color: '#00f0ff' }}>Global</span>
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
              <Link href="/ai-chat" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 600 }}>
                🤖 AI Career Chat
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
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Legal &amp; Privacy</h4>
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
                Delete Account &amp; Data
              </Link>
            </li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.8rem' }}>Assistance</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 0.8rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <li>
              <Link href="/support" style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                🎧 Support &amp; Enquiries Desk
              </Link>
            </li>
          </ul>
          <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.82rem', color: '#64748b' }}>
            Compliance &amp; Developer Email:
          </p>
          <a
            href="mailto:cleanconnectng@gmail.com"
            style={{ color: '#00f0ff', textDecoration: 'none', fontWeight: 600, fontSize: '0.88rem' }}
          >
            cleanconnectng@gmail.com
          </a>
        </div>
      </div>

      {/* App Stores (Google Play & Apple App Store) + Social Media Icons */}
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
        gap: '1.25rem',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.98rem' }}>
            📱 Download &amp; Share JobHub Global Mobile App
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem', marginTop: '2px' }}>
            Official Google Play Store, Apple App Store &amp; Social Channels
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Google Play Store Badge */}
          <button
            type="button"
            onClick={() => handleChannelClick('Google Play Store')}
            title="Google Play Store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#141923',
              border: '1px solid rgba(52, 168, 83, 0.6)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3.61 1.814L13.793 12 3.61 22.186a1.48 1.48 0 0 1-.61-1.2V3.014c0-.49.23-.93.61-1.2z" fill="#00F0FF"/>
              <path d="M17.228 8.565L13.793 12l3.435 3.435 3.882-2.218c.79-.45.79-1.984 0-2.434l-3.882-2.218z" fill="#FBBC04"/>
              <path d="M3.61 1.814L17.228 8.565 13.793 12 3.61 1.814z" fill="#34A853"/>
              <path d="M3.61 22.186L13.793 12l3.435 3.435L3.61 22.186z" fill="#EA4335"/>
            </svg>
            Google Play
          </button>

          {/* Apple App Store Badge */}
          <button
            type="button"
            onClick={() => handleChannelClick('Apple App Store')}
            title="Apple App Store"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#141923',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease, background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.33c.67-.81 1.12-1.94 1-3.08-.96.04-2.13.64-2.82 1.45-.61.7-.15 1.85-1.03 2.97 1.08.08 2.18-.53 2.85-1.34z"/>
            </svg>
            App Store
          </button>

          {/* Divider */}
          <span style={{ width: '1px', height: '22px', background: 'rgba(255,255,255,0.12)', margin: '0 2px' }} />

          {/* Facebook */}
          <button
            type="button"
            onClick={() => handleChannelClick('Facebook')}
            title="Facebook"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#1877F2',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c5.05-.5 9-4.76 9-9.95z"/></svg>
            Facebook
          </button>

          {/* WhatsApp */}
          <button
            type="button"
            onClick={() => handleChannelClick('WhatsApp')}
            title="WhatsApp"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#25D366',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.82 14.01c-.24.68-1.41 1.3-1.95 1.38-.5.08-1.13.11-1.83-.11-.42-.13-.97-.31-1.67-.61-2.95-1.27-4.88-4.25-5.03-4.45-.15-.2-1.2-1.6-1.2-3.05 0-1.45.76-2.16 1.03-2.46.27-.3.59-.37.79-.37.2 0 .4 0 .57.01.18.01.43-.07.67.51.24.59.82 2.01.89 2.16.07.15.12.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.44.52-.15.15-.3.31-.13.61.17.3.76 1.26 1.64 2.04 1.13 1.01 2.08 1.32 2.38 1.47.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.49.22.57.35.07.12.07.72-.17 1.4z"/></svg>
            WhatsApp
          </button>

          {/* Instagram */}
          <button
            type="button"
            onClick={() => handleChannelClick('Instagram')}
            title="Instagram"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z"/></svg>
            Instagram
          </button>

          {/* TikTok */}
          <button
            type="button"
            onClick={() => handleChannelClick('TikTok')}
            title="TikTok"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#111111',
              border: '1px solid #00f0ff',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/></svg>
            TikTok
          </button>

          {/* YouTube */}
          <button
            type="button"
            onClick={() => handleChannelClick('YouTube')}
            title="YouTube"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: '#FF0000',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.8rem',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
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
        <span>&copy; {new Date().getFullYear()} Clean Connect. All rights reserved.</span>
        <span>Secure &amp; Verified Recruitment Ecosystem</span>
      </div>
    </footer>
  );
}
