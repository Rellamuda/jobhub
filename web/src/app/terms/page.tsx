'use client';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#120B1C', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="JobHub AI" width="64" height="64" style={{ marginBottom: '1rem', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Terms of Service</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>Last Updated: October 9, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.98rem' }}>
          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>1. Agreement to Terms</h2>
            <p>
              By accessing or using the JobHub AI website or mobile application, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the service.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>2. Accounts and Responsibilities</h2>
            <p>
              When you create an account with us, you must provide accurate, current, and complete information. You are responsible for safeguarding your password and account credentials. JobHub AI reserves the right to suspend or terminate accounts that provide fraudulent information or engage in abusive conduct.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>3. Employer &amp; Candidate Standards</h2>
            <ul style={{ paddingLeft: '1.5rem' }}>
              <li><strong>Employers</strong> represent and warrant that all posted vacancies correspond to genuine, legitimate job opportunities with lawful compensation.</li>
              <li><strong>Job Seekers</strong> represent that all qualifications, work history, and certificates uploaded to the platform are truthful and accurate.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>4. Subscriptions &amp; Billing</h2>
            <p>
              JobHub AI offers subscription tiers (Free, Silver, and Premium). Subscription fees are billed in accordance with the pricing presented at checkout and processed through regulated payment processors (Paystack, Flutterwave). All fees are non-refundable except where required by applicable consumer law.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>5. Limitation of Liability</h2>
            <p>
              JobHub AI provides matching tools and AI career assistance &ldquo;as is&rdquo;. We do not guarantee employment for candidates or candidate availability for employers. In no event shall JobHub AI be liable for any indirect, incidental, or consequential damages arising from the use of our services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>6. Contact Us</h2>
            <p>
              For inquiries regarding these Terms, contact our legal department at <a href="mailto:support@jobhubai.com" style={{ color: '#00F0FF' }}>support@jobhubai.com</a>.
            </p>
          </section>
        </div>

        <div style={{ marginTop: '2.5rem', textAlign: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.5rem' }}>
          <Link href="/" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: 'bold' }}>
            ← Return to JobHub AI Home
          </Link>
        </div>
      </div>
    </main>
  );
}
