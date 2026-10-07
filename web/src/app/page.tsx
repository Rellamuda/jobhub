import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <main style={{ padding: '2rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 style={{ fontSize: '4rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
          Welcome to <span className="text-gradient">JobHub AI</span>
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          The global AI employment operating system that helps job seekers build careers and helps employers hire talent efficiently through automation and intelligence.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>For Job Seekers</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Generate ATS-optimized resumes, custom cover letters, and get instant AI matching scores for your dream jobs.
          </p>
          <Link href="/jobs">
            <button className="btn-primary">Find a Job</button>
          </Link>
        </div>

        <div className="glass-panel">
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>For Employers</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Automate your hiring pipeline. Let our AI rank and shortlist the absolute best candidates for your open roles.
          </p>
          <Link href="/jobs/create">
            <button className="btn-primary" style={{ background: 'transparent', border: '1px solid var(--secondary-color)', boxShadow: 'none' }}>Post a Job</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
