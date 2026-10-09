'use client';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '3rem 1.5rem' }}>
      <div style={{ maxWidth: '850px', margin: '0 auto', backgroundColor: '#120B1C', padding: '2.5rem', borderRadius: '20px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <img src="/logo.png" alt="JobHub AI" width="64" height="64" style={{ marginBottom: '1rem', objectFit: 'contain' }} />
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, margin: 0 }}>Privacy Policy</h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>Effective Date: October 9, 2026</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', lineHeight: 1.7, color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.98rem' }}>
          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>1. Introduction</h2>
            <p>
              Welcome to <strong>JobHub AI</strong> (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). We are committed to protecting your personal information and your right to privacy. This Privacy Policy governs your use of the JobHub AI website and mobile application (available on Google Play). It explains how we collect, use, disclose, and safeguard your data when you visit our platform or utilize our recruitment services.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>2. Information We Collect</h2>
            <p>We collect information that you voluntarily provide to us when registering, completing onboarding, creating job postings, or submitting applications:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Account Credentials:</strong> Email address, encrypted password, user role (Job Seeker or Employer).</li>
              <li><strong>Job Seeker Profiles:</strong> First name, last name, phone number, date of birth, gender, location (city, state, country), skills, resume/CV documents, work experience, and educational background.</li>
              <li><strong>Employer &amp; Recruiter Data:</strong> Company name, business registration number (RC/EIN), website, corporate address, HR contact details, and job opening descriptions.</li>
              <li><strong>Transaction Information:</strong> Billing records, payment reference identifiers, and subscription tiers processed securely through third-party gateways. We do not store raw credit card numbers.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>3. How We Use Your Information</h2>
            <p>Your data is used strictly for legitimate career and recruitment operations:</p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li>To match qualified candidates with relevant job vacancies using AI algorithms.</li>
              <li>To process applications and send match notifications with user consent.</li>
              <li>To provide resume ATS score evaluations and career health assessments.</li>
              <li>To detect and prevent fraudulent postings, spam, and identity impersonation.</li>
              <li>To facilitate customer support and comply with applicable employment laws.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>4. Third-Party Service Providers</h2>
            <p>
              We may share necessary data with trusted third-party providers strictly to enable platform services:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>Payment Processors:</strong> Paystack and Flutterwave for processing secure subscription payments.</li>
              <li><strong>AI Processing:</strong> Secured cloud AI providers for ATS parsing and career suggestions under strict confidentiality.</li>
              <li><strong>Infrastructure:</strong> Cloud hosting and encrypted database storage facilities.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>5. User Consent &amp; Autonomous Matching</h2>
            <p>
              JobHub AI requires explicit candidate approval before any job application is submitted on their behalf. Users may review the vacancy details, job requirements, and company profile before providing consent.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>6. Account and Data Deletion (Google Play Compliance)</h2>
            <p>
              In compliance with Google Play Developer Policies, all users have the absolute right to request the permanent deletion of their account and all associated personal data:
            </p>
            <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem' }}>
              <li><strong>In-App Deletion:</strong> You can delete your account at any time within the mobile app by visiting <em>Profile &gt; Legal &amp; Account &gt; Delete Account</em>.</li>
              <li><strong>Web Portal Deletion:</strong> You can also submit an account deletion request via our public web portal at <Link href="/delete-account" style={{ color: '#00F0FF' }}>https://jobhub.ai/delete-account</Link>.</li>
            </ul>
            <p style={{ marginTop: '0.5rem' }}>
              Upon account deletion, all personal data, resumes, applications, messages, and uploaded credentials are permanently purged from our active databases.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#00F0FF', marginBottom: '0.5rem' }}>7. Contact Information</h2>
            <p>
              If you have any questions or concerns regarding this Privacy Policy or your data, please contact our Data Protection Officer:
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>JobHub AI Privacy Team</strong><br />
              Email: <a href="mailto:support@jobhubai.com" style={{ color: '#00F0FF' }}>support@jobhubai.com</a><br />
              Website: <a href="/" style={{ color: '#00F0FF' }}>https://jobhub.ai</a>
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
