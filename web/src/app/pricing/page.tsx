'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const upgradeToPremium = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      // In a real app, this would redirect to Stripe/Paystack.
      // For MVP, we directly upgrade the profile.
      const res = await fetch('/api/profiles/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        alert('Successfully upgraded to Premium! 🎉');
        router.push('/profile');
      } else {
        alert('Failed to upgrade.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '3rem', marginBottom: '1rem', background: 'linear-gradient(90deg, #6366F1, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Unlock Your Career Potential
      </h1>
      <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '3rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        JobHub AI Premium gives you unlimited access to our powerful AI tools to land your dream job faster.
      </p>

      <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* FREE TIER */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '400px', padding: '3rem 2rem', textAlign: 'left', borderTop: '4px solid gray' }}>
          <h2 style={{ fontSize: '2rem', margin: 0 }}>Basic</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>Free</div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>For casual job seekers.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'white' }}>
            <li>✔️ Basic Job Search</li>
            <li>✔️ Standard Profile</li>
            <li>✔️ 1 AI Generation per month</li>
            <li style={{ color: 'gray' }}>❌ Unlimited AI Resume Builder</li>
            <li style={{ color: 'gray' }}>❌ Unlimited AI Cover Letters</li>
            <li style={{ color: 'gray' }}>❌ Unlimited AI Match Scoring</li>
          </ul>
          <button disabled style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', borderRadius: '12px' }}>
            Current Plan
          </button>
        </div>

        {/* PREMIUM TIER */}
        <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '400px', padding: '3rem 2rem', textAlign: 'left', borderTop: '4px solid #00F0FF', transform: 'scale(1.05)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' }}>
          <div style={{ background: '#00F0FF', color: 'black', padding: '0.2rem 1rem', borderRadius: '20px', display: 'inline-block', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '1rem' }}>RECOMMENDED</div>
          <h2 style={{ fontSize: '2rem', margin: 0, color: '#00F0FF' }}>Premium</h2>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', margin: '1rem 0' }}>₦5,000<span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/mo</span></div>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Supercharge your job hunt with AI.</p>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem', color: 'white' }}>
            <li>✨ <strong>Unlimited</strong> AI Resume Builder</li>
            <li>✨ <strong>Unlimited</strong> AI Cover Letters</li>
            <li>✨ <strong>Unlimited</strong> AI Match Scoring</li>
            <li>✨ Priority Applicant Ranking</li>
            <li>✨ Verified Profile Badge Options</li>
            <li>✨ Advanced Career Coaching Insights</li>
          </ul>
          <button onClick={upgradeToPremium} disabled={loading} style={{ width: '100%', padding: '1rem', marginTop: '2rem', background: 'linear-gradient(90deg, #6366F1, #00F0FF)', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
            {loading ? 'Processing...' : 'Upgrade Now'}
          </button>
        </div>
      </div>
    </main>
  );
}
