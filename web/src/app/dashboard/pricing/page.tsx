'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap, Shield, Sparkles, Building2, User } from 'lucide-react';

export default function DashboardPricingPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SEEKER' | 'EMPLOYER'>('SEEKER');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(user => {
          if (user && user.role === 'EMPLOYER') setActiveTab('EMPLOYER');
        })
        .catch(console.error);
    }
  }, []);

  const handleUpgrade = async (tier: 'SILVER' | 'PREMIUM', role: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return router.push('/login');

      const res = await fetch('/api/profiles/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier })
      });
      if (res.ok) {
        alert(`Successfully upgraded to ${tier} tier! 🎉`);
        router.push(role === 'EMPLOYER' ? '/applications' : '/jobs');
      } else {
        alert('Failed to upgrade plan.');
      }
    } catch (e) {
      console.error(e);
      alert('Network error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 text-white">
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-cyan-400 to-indigo-500 bg-clip-text text-transparent">
          Subscription & Monetization Plans
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
          Choose between candidate career enhancement tiers or employer recruitment power plans.
        </p>

        {/* Tab Switcher */}
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
      </div>

      {activeTab === 'SEEKER' ? (
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
          <Card className="p-6 bg-cyan-950/20 border-2 border-cyan-400 text-white rounded-2xl shadow-xl shadow-cyan-500/10">
            <CardHeader className="p-0 mb-4">
              <span className="bg-cyan-400 text-black text-xs font-black px-2.5 py-0.5 rounded-full inline-block w-fit mb-2">RECOMMENDED</span>
              <h3 className="text-xl font-bold text-cyan-300">Silver Plan</h3>
              <div className="mt-2 text-4xl font-black">$10<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-sm text-gray-200">
                <li className="flex items-center gap-2 text-cyan-300">✨ Unlimited AI Resume building</li>
                <li className="flex items-center gap-2 text-cyan-300">✨ Unlimited AI Cover Letter generation</li>
                <li className="flex items-center gap-2 text-cyan-300">✨ Autonomous Application auto-pilot</li>
                <li className="flex items-center gap-2 text-cyan-300">✨ Unlimited Job Matches & scoring</li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('SILVER', 'JOB_SEEKER')} 
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold mt-6"
              >
                {loading ? 'Processing...' : 'Upgrade to Silver ($10/mo)'}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Free Tier */}
          <Card className="p-6 bg-white/5 border border-white/10 text-white rounded-2xl">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-gray-300">Free Tier</h3>
              <div className="mt-2 text-4xl font-black">$0<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">✔️ Post up to 3 jobs</li>
                <li className="flex items-center gap-2">✔️ Only 3 candidate matches/month</li>
                <li className="flex items-center gap-2">✔️ Standard applicant dashboard</li>
              </ul>
              <Button disabled className="w-full bg-white/10 text-gray-400 border border-white/10 mt-6">
                Active Default Tier
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="p-6 bg-cyan-950/20 border-2 border-cyan-400 text-white rounded-2xl shadow-xl shadow-cyan-500/10">
            <CardHeader className="p-0 mb-4">
              <span className="bg-cyan-400 text-black text-xs font-black px-2.5 py-0.5 rounded-full inline-block w-fit mb-2">RECOMMENDED</span>
              <h3 className="text-xl font-bold text-cyan-300">Premium</h3>
              <div className="mt-2 text-4xl font-black">$50<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-xs md:text-sm text-gray-200">
                <li className="flex items-center gap-2">🚀 Post up to 70 jobs/month</li>
                <li className="flex items-center gap-2">🚀 Up to 50 instant qualified matches</li>
                <li className="flex items-center gap-2">🚀 AI Job vacancies build assist</li>
                <li className="flex items-center gap-2">🚀 Priority Applicant Ranking</li>
                <li className="flex items-center gap-2">🚀 Verified Profile Badge option</li>
                <li className="flex items-center gap-2">🚀 40 AI Match Scoring advance coaching</li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('PREMIUM', 'EMPLOYER')} 
                disabled={loading}
                className="w-full bg-cyan-400 hover:bg-cyan-300 text-black font-bold mt-6"
              >
                {loading ? 'Processing...' : 'Upgrade to Premium ($50/mo)'}
              </Button>
            </CardContent>
          </Card>

          {/* Silver Plan for Employers */}
          <Card className="p-6 bg-purple-950/20 border border-purple-400 text-white rounded-2xl">
            <CardHeader className="p-0 mb-4">
              <h3 className="text-xl font-bold text-purple-300">Silver / Enterprise</h3>
              <div className="mt-2 text-4xl font-black">$100<span className="text-sm text-gray-400 font-normal">/mo</span></div>
            </CardHeader>
            <CardContent className="p-0 space-y-4">
              <ul className="space-y-3 text-xs md:text-sm text-gray-200">
                <li className="flex items-center gap-2">👑 Unlimited AI Resume & Cover Letters</li>
                <li className="flex items-center gap-2">👑 Unlimited AI Match Scoring</li>
                <li className="flex items-center gap-2">👑 Best Priority Ranking across platform</li>
                <li className="flex items-center gap-2">👑 Verified Profile Badge options</li>
                <li className="flex items-center gap-2">👑 Advanced Career Coaching Insights</li>
              </ul>
              <Button 
                onClick={() => handleUpgrade('SILVER', 'EMPLOYER')} 
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold mt-6"
              >
                {loading ? 'Processing...' : 'Subscribe Silver ($100/mo)'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
