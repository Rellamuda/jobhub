'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Shield, Sparkles, Building2, User, Lock, ArrowRight, X, ShieldCheck } from 'lucide-react';

export default function DashboardPricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  const [processingTier, setProcessingTier] = useState<string | null>(null);

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

  const handleProcessPayment = async (tier: string, amount: number) => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/login');

    setProcessingTier(tier);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount,
          plan: tier,
          email: userEmail || 'user@jobhub.ai',
          provider: 'AUTO',
          callbackUrl: `${window.location.origin}/pricing?status=success`
        })
      });

      const data = await res.json();
      if (res.ok && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        alert(data.message || 'Payment initialization failed. Please try again.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error initializing payment.');
    } finally {
      setProcessingTier(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
          {userRole === 'JOB_SEEKER' ? 'Job Seeker Membership Plans' : userRole === 'EMPLOYER' ? 'Employer Hiring Power Plans' : 'Subscription & Monetization Plans'}
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          {userRole === 'JOB_SEEKER'
            ? 'Supercharge your job search with unlimited AI resume building, cover letters, and autonomous applications.'
            : userRole === 'EMPLOYER'
            ? 'Scale your talent acquisition with AI vacancy creation, priority applicant ranking, and verified badges.'
            : 'Choose between candidate career enhancement tiers or employer recruitment power plans.'}
        </p>

        {/* Tab Switcher: Only displayed if user role is unknown */}
        {!userRole && (
          <div className="inline-flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 mt-4">
            <button
              onClick={() => setActiveTab('SEEKER')}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'SEEKER' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <User size={16} /> Job Seekers
            </button>
            <button
              onClick={() => setActiveTab('EMPLOYER')}
              className={`px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition ${activeTab === 'EMPLOYER' ? 'bg-cyan-500 text-black' : 'text-gray-400 hover:text-white'}`}
            >
              <Building2 size={16} /> Employers
            </button>
          </div>
        )}
      </div>

      {/* JOB SEEKER PLANS */}
      {(userRole === 'JOB_SEEKER' || (!userRole && activeTab === 'SEEKER')) && (
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Tier */}
          <Card className="p-6 bg-white/5 border border-white/10 text-white rounded-2xl">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-gray-300">Free Tier</h3>
              <div className="mt-2 text-4xl font-black">$0<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">✔️ 1 Resume & Cover Letter built</li>
                <li className="flex items-center gap-2">✔️ 1 Autonomous Application</li>
                <li className="flex items-center gap-2">✔️ 1 Click to Apply enabled</li>
                <li className="flex items-center gap-2">✔️ Only 3 Job matches after onboarding</li>
              </ul>
              <Button disabled className="w-full bg-white/10 text-gray-400 border border-white/10 mt-6">
                Active Default Tier
              </Button>
            </CardContent>
          </Card>

          {/* Silver Plan */}
          <Card className="p-6 bg-white/5 border-2 border-cyan-400/50 text-white rounded-2xl shadow-xl shadow-cyan-500/10 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-cyan-400 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              POPULAR
            </div>
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-cyan-400">Silver Plan</h3>
              <div className="mt-2 text-4xl font-black text-white">$10<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-sm text-white">
                <li className="flex items-center gap-2">✨ Unlimited AI Resume & Cover Letter building</li>
                <li className="flex items-center gap-2">✨ Autonomous Job Applications auto-pilot</li>
                <li className="flex items-center gap-2">✨ Unlimited Job Matches & Alerts</li>
                <li className="flex items-center gap-2">✨ Priority Application Delivery</li>
                <li className="flex items-center gap-2">✨ Career Health & Digital Credential Verification</li>
              </ul>
              <Button 
                onClick={() => handleProcessPayment('SILVER', 10)}
                disabled={processingTier !== null}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold mt-6"
              >
                {processingTier === 'SILVER' ? 'Redirecting to Checkout...' : 'Upgrade to Silver ($10/mo)'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* EMPLOYER PLANS */}
      {(userRole === 'EMPLOYER' || (!userRole && activeTab === 'EMPLOYER')) && (
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {/* Free Tier */}
          <Card className="p-6 bg-white/5 border border-white/10 text-white rounded-2xl">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-gray-300">Free Tier</h3>
              <div className="mt-2 text-4xl font-black">$0<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-xs text-gray-300">
                <li>✔️ Post up to 3 jobs</li>
                <li>✔️ Only 3 job seeker matches per month</li>
                <li>✔️ Basic applicant management</li>
              </ul>
              <Button disabled className="w-full bg-white/10 text-gray-400 border border-white/10 mt-6">
                Active Default Tier
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 bg-white/5 border-2 border-cyan-400 text-white rounded-2xl shadow-xl shadow-cyan-500/10 relative overflow-hidden">
            <div className="absolute top-3 right-3 bg-cyan-400 text-black text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
              RECOMMENDED
            </div>
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-cyan-400">Premium</h3>
              <div className="mt-2 text-4xl font-black text-white">$50<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-xs text-white">
                <li>🚀 Post up to 70 jobs per month</li>
                <li>🚀 Up to 50 instant qualified matches</li>
                <li>🚀 AI Job vacancies build assist</li>
                <li>🚀 Priority Applicant Ranking</li>
                <li>🚀 Verified Profile Badge option</li>
                <li>🚀 40 AI Match Scoring coaching</li>
              </ul>
              <Button 
                onClick={() => handleProcessPayment('PREMIUM', 50)}
                disabled={processingTier !== null}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold mt-6"
              >
                {processingTier === 'PREMIUM' ? 'Redirecting to Checkout...' : 'Upgrade to Premium ($50/mo)'}
              </Button>
            </CardContent>
          </Card>

          {/* Silver / Enterprise Plan */}
          <Card className="p-6 bg-white/5 border border-purple-500/40 text-white rounded-2xl">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-purple-400">Silver / Enterprise</h3>
              <div className="mt-2 text-4xl font-black text-white">$100<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-xs text-white">
                <li>👑 Unlimited AI Resume & Cover Letter building</li>
                <li>👑 Unlimited AI match Scoring</li>
                <li>👑 Best Priority Ranking across platform</li>
                <li>👑 Verified Profile Badge</li>
                <li>👑 Advanced coaching & insights</li>
                <li>👑 Unlimited job postings</li>
              </ul>
              <Button 
                onClick={() => handleProcessPayment('SILVER', 100)}
                disabled={processingTier !== null}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-bold mt-6"
              >
                {processingTier === 'SILVER' && userRole === 'EMPLOYER' ? 'Redirecting to Checkout...' : 'Subscribe Silver ($100/mo)'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
