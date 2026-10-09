'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, Star, Zap, ShieldCheck, Sparkles, Building2, User, CreditCard, Lock, ArrowRight, X } from 'lucide-react';

export default function PricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER');
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Payment checkout modal state
  const [checkoutModal, setCheckoutModal] = useState<{
    isOpen: boolean;
    tier: string;
    targetRole: string;
    amount: number;
    title: string;
  }>({
    isOpen: false,
    tier: '',
    targetRole: '',
    amount: 0,
    title: ''
  });

  const [paymentProvider, setPaymentProvider] = useState<'PAYSTACK' | 'FLUTTERWAVE'>('PAYSTACK');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(user => {
          if (user) {
            setUserRole(user.role);
            setUserEmail(user.email || '');
            if (user.role === 'EMPLOYER') {
              setActiveTab('EMPLOYER');
            } else if (user.role === 'JOB_SEEKER') {
              setActiveTab('SEEKER');
            }
          }
        })
        .catch(console.error);
    }
  }, []);

  const openCheckout = (tier: string, targetRole: string, amount: number, title: string) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setCheckoutModal({
      isOpen: true,
      tier,
      targetRole,
      amount,
      title
    });
  };

  const handleProcessPayment = async () => {
    setIsProcessingPayment(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: checkoutModal.amount,
          plan: checkoutModal.tier,
          email: userEmail || 'user@jobhub.ai',
          provider: paymentProvider,
          callbackUrl: `${window.location.origin}/pricing?status=success`
        })
      });

      const data = await res.json();
      if (res.ok && data.authorization_url) {
        // Redirect directly to the secure payment page
        window.location.href = data.authorization_url;
      } else {
        alert(data.message || 'Payment initialization failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error initializing payment.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  return (
    <main style={{ padding: '3rem 1.5rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, marginBottom: '0.8rem', background: 'linear-gradient(90deg, #6366F1, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {userRole === 'JOB_SEEKER' ? 'Job Seeker Membership Plans' : userRole === 'EMPLOYER' ? 'Employer & Recruiter Hiring Plans' : 'Flexible Plans for Talent & Employers'}
        </h1>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto' }}>
          {userRole === 'JOB_SEEKER' 
            ? 'Supercharge your job search with unlimited AI resume building, cover letters, and autonomous applications.'
            : userRole === 'EMPLOYER'
            ? 'Scale your talent acquisition with AI vacancy creation, priority applicant ranking, and verified badges.'
            : 'Choose the right plan to accelerate your job hunt or streamline high-performance hiring with verified AI tools.'}
        </p>

        {/* Tab Switcher: Only displayed if not logged in (Item 9 requirement) */}
        {!userRole && (
          <div style={{ display: 'inline-flex', gap: '0.5rem', background: 'rgba(255,255,255,0.06)', padding: '6px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', marginTop: '2rem' }}>
            <button
              onClick={() => setActiveTab('SEEKER')}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'SEEKER' ? 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)' : 'transparent',
                color: activeTab === 'SEEKER' ? '#000' : '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <User size={18} /> For Job Seekers
            </button>
            <button
              onClick={() => setActiveTab('EMPLOYER')}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === 'EMPLOYER' ? 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)' : 'transparent',
                color: activeTab === 'EMPLOYER' ? '#000' : '#fff',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Building2 size={18} /> For Employers & Recruiters
            </button>
          </div>
        )}
      </div>

      {/* JOB SEEKER PLANS: Visible only if activeTab === 'SEEKER' */}
      {(userRole === 'JOB_SEEKER' || (!userRole && activeTab === 'SEEKER')) && (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          {/* Free Tier */}
          <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '380px', padding: '2.5rem 2rem', textAlign: 'left', borderTop: '4px solid #71717a' }}>
            <h2 style={{ fontSize: '1.8rem', margin: 0 }}>Free Tier</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1rem 0' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Essential starter tools to begin your career journey.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: '#e4e4e7', fontSize: '0.95rem' }}>
              <li>✔️ <strong>1 Resume & Cover Letter</strong> built</li>
              <li>✔️ <strong>1 Autonomous Application</strong> credit</li>
              <li>✔️ <strong>One-Click Apply</strong> enabled</li>
              <li>✔️ <strong>Only 3 Job Matches</strong> after onboarding</li>
              <li style={{ color: '#71717a' }}>❌ Unlimited Autonomous Applications</li>
              <li style={{ color: '#71717a' }}>❌ Unlimited AI Resume & Cover Letters</li>
            </ul>
            <button 
              disabled 
              style={{ width: '100%', padding: '0.85rem', marginTop: '2rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#a1a1aa', borderRadius: '12px', fontWeight: 'bold' }}
            >
              Current Active Plan
            </button>
          </div>

          {/* Silver Plan */}
          <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '380px', padding: '2.5rem 2rem', textAlign: 'left', borderTop: '4px solid #00F0FF', transform: 'scale(1.03)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' }}>
            <div style={{ background: '#00F0FF', color: 'black', padding: '0.2rem 0.8rem', borderRadius: '20px', display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>POPULAR FOR TALENT</div>
            <h2 style={{ fontSize: '1.8rem', margin: 0, color: '#00F0FF' }}>Silver Plan</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1rem 0' }}>$10 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Unlimited AI power to match, tailor and autonomously apply.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.85rem', color: 'white', fontSize: '0.95rem' }}>
              <li>✨ <strong>Unlimited AI Resume</strong> tailoring & builder</li>
              <li>✨ <strong>Unlimited AI Cover Letter</strong> generation</li>
              <li>✨ <strong>Autonomous Job Applications</strong> auto-pilot</li>
              <li>✨ <strong>Unlimited Job Matches</strong> & Instant Alerts</li>
              <li>✨ Priority Application Delivery to Employers</li>
              <li>✨ Career Health & Digital Credential Verification</li>
            </ul>
            <button 
              onClick={() => openCheckout('SILVER', 'JOB_SEEKER', 10, 'Job Seeker Silver Plan ($10/mo)')} 
              disabled={loading} 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.85rem', marginTop: '2rem', fontWeight: 'bold', fontSize: '1.05rem', cursor: 'pointer' }}
            >
              Upgrade to Silver ($10/mo)
            </button>
          </div>
        </div>
      )}

      {/* EMPLOYER PLANS: Visible only if activeTab === 'EMPLOYER' */}
      {(userRole === 'EMPLOYER' || (!userRole && activeTab === 'EMPLOYER')) && (
        <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
          {/* Free Tier */}
          <div className="glass-panel" style={{ flex: '1', minWidth: '280px', maxWidth: '350px', padding: '2.5rem 1.8rem', textAlign: 'left', borderTop: '4px solid #71717a' }}>
            <h2 style={{ fontSize: '1.7rem', margin: 0 }}>Free Tier</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1rem 0' }}>$0 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>For startups testing hiring workflows.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: '#e4e4e7', fontSize: '0.9rem' }}>
              <li>✔️ Post <strong>up to 3 jobs</strong></li>
              <li>✔️ <strong>Only 3 job seeker matches</strong> per month</li>
              <li>✔️ Basic applicant inbox & messages</li>
              <li style={{ color: '#71717a' }}>❌ AI vacancy build assistance</li>
              <li style={{ color: '#71717a' }}>❌ Verified Company Badge</li>
              <li style={{ color: '#71717a' }}>❌ Priority Applicant Ranking</li>
            </ul>
            <button 
              disabled 
              style={{ width: '100%', padding: '0.85rem', marginTop: '2rem', background: 'rgba(255,255,255,0.08)', border: 'none', color: '#a1a1aa', borderRadius: '12px', fontWeight: 'bold' }}
            >
              Current Active Plan
            </button>
          </div>

          {/* Premium Plan */}
          <div className="glass-panel" style={{ flex: '1', minWidth: '300px', maxWidth: '380px', padding: '2.5rem 1.8rem', textAlign: 'left', borderTop: '4px solid #00F0FF', transform: 'scale(1.03)', boxShadow: '0 0 30px rgba(0, 240, 255, 0.2)' }}>
            <div style={{ background: '#00F0FF', color: 'black', padding: '0.2rem 0.8rem', borderRadius: '20px', display: 'inline-block', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.8rem' }}>RECOMMENDED FOR RECRUITERS</div>
            <h2 style={{ fontSize: '1.7rem', margin: 0, color: '#00F0FF' }}>Premium</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1rem 0' }}>$50 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>Scaling companies hiring quality talent consistently.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'white', fontSize: '0.9rem' }}>
              <li>🚀 Post <strong>up to 70 jobs</strong> per month</li>
              <li>🚀 <strong>Up to 50 instant qualified matches</strong> per job</li>
              <li>🚀 <strong>AI Job vacancies build assist</strong> before posting</li>
              <li>🚀 <strong>Priority Applicant Ranking</strong></li>
              <li>🚀 <strong>Verified Profile Badge option</strong></li>
              <li>🚀 <strong>40 AI Match Scoring</strong> advance coaching</li>
            </ul>
            <button 
              onClick={() => openCheckout('PREMIUM', 'EMPLOYER', 50, 'Employer Premium Plan ($50/mo)')} 
              disabled={loading} 
              className="btn-primary" 
              style={{ width: '100%', padding: '0.85rem', marginTop: '2rem', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              Upgrade to Premium ($50/mo)
            </button>
          </div>

          {/* Silver / Enterprise Tier */}
          <div className="glass-panel" style={{ flex: '1', minWidth: '280px', maxWidth: '350px', padding: '2.5rem 1.8rem', textAlign: 'left', borderTop: '4px solid #c084fc' }}>
            <h2 style={{ fontSize: '1.7rem', margin: 0, color: '#c084fc' }}>Silver / Enterprise</h2>
            <div style={{ fontSize: '2.5rem', fontWeight: 900, margin: '1rem 0' }}>$100 <span style={{ fontSize: '1rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>/ month</span></div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem' }}>High-volume agencies & executive talent recruiters.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.8rem', color: 'white', fontSize: '0.9rem' }}>
              <li>👑 <strong>Unlimited AI Resume & Cover Letter</strong> building</li>
              <li>👑 <strong>Unlimited AI Match Scoring</strong></li>
              <li>👑 <strong>Best Priority Ranking</strong> across all searches</li>
              <li>👑 <strong>Verified Profile Badge options</strong></li>
              <li>👑 <strong>Advanced Career Coaching Insights</strong></li>
              <li>👑 Unlimited Job Postings & Candidate Pipeline</li>
            </ul>
            <button 
              onClick={() => openCheckout('SILVER', 'EMPLOYER', 100, 'Employer Silver / Enterprise Plan ($100/mo)')} 
              disabled={loading} 
              style={{ width: '100%', padding: '0.85rem', marginTop: '2rem', background: 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)', border: 'none', color: 'white', borderRadius: '12px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' }}
            >
              Subscribe Silver ($100/mo)
            </button>
          </div>
        </div>
      )}

      {/* CHECKOUT & PAYMENT MODAL */}
      {checkoutModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#120B1C] border border-white/20 rounded-3xl max-w-md w-full p-6 md:p-8 space-y-6 text-left shadow-2xl relative">
            <button 
              onClick={() => setCheckoutModal({ ...checkoutModal, isOpen: false })}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg"
            >
              <X size={20} />
            </button>

            <div>
              <div className="text-xs uppercase tracking-widest font-black text-cyan-400 mb-1 flex items-center gap-1.5">
                <Lock size={13} /> SECURE CHECKOUT
              </div>
              <h3 className="text-2xl font-black text-white">
                {checkoutModal.title}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Select your preferred payment gateway to activate your membership instantly.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400">Total Billed:</span>
                <div className="text-2xl font-black text-white">${checkoutModal.amount} <span className="text-xs font-normal text-gray-400">USD</span></div>
              </div>
              <div className="text-xs text-right text-cyan-400 font-semibold">
                Instant Activation • Cancel Anytime
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Select Payment Gateway:</label>
              
              {/* Paystack Option */}
              <div 
                onClick={() => setPaymentProvider('PAYSTACK')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${paymentProvider === 'PAYSTACK' ? 'border-cyan-400 bg-cyan-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                    💳
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Paystack</h4>
                    <p className="text-xs text-gray-400">Cards, Bank Transfer, USSD & Apple Pay</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentProvider === 'PAYSTACK' ? 'border-cyan-400 bg-cyan-400' : 'border-gray-500'}`}>
                  {paymentProvider === 'PAYSTACK' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </div>
              </div>

              {/* Flutterwave Option */}
              <div 
                onClick={() => setPaymentProvider('FLUTTERWAVE')}
                className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${paymentProvider === 'FLUTTERWAVE' ? 'border-orange-400 bg-orange-500/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-600/30 flex items-center justify-center text-orange-400 font-bold text-xs">
                    🌊
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Flutterwave</h4>
                    <p className="text-xs text-gray-400">Debit/Credit Card, Mobile Money, Bank Account</p>
                  </div>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentProvider === 'FLUTTERWAVE' ? 'border-orange-400 bg-orange-400' : 'border-gray-500'}`}>
                  {paymentProvider === 'FLUTTERWAVE' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                </div>
              </div>
            </div>

            <button
              onClick={handleProcessPayment}
              disabled={isProcessingPayment}
              className="w-full py-3.5 rounded-xl font-black text-black bg-gradient-to-r from-cyan-400 to-blue-500 hover:opacity-95 transition shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isProcessingPayment ? (
                'Connecting to Secure Gateway...'
              ) : (
                <>
                  Proceed with {paymentProvider === 'PAYSTACK' ? 'Paystack' : 'Flutterwave'} <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="text-center text-[11px] text-gray-500 flex items-center justify-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>256-Bit SSL Encrypted & PCI-DSS Level 1 Certified</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
