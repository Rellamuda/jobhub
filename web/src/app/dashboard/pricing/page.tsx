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
                onClick={() => openCheckout('SILVER', 'JOB_SEEKER', 10, 'Job Seeker Silver Plan ($10/mo)')}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold mt-6"
              >
                Upgrade to Silver ($10/mo)
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
                onClick={() => openCheckout('PREMIUM', 'EMPLOYER', 50, 'Employer Premium Plan ($50/mo)')}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-black font-bold mt-6"
              >
                Upgrade to Premium ($50/mo)
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
                onClick={() => openCheckout('SILVER', 'EMPLOYER', 100, 'Employer Silver Plan ($100/mo)')}
                className="w-full bg-gradient-to-r from-purple-500 to-indigo-600 hover:opacity-90 text-white font-bold mt-6"
              >
                Subscribe Silver ($100/mo)
              </Button>
            </CardContent>
          </Card>
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
                Select your payment gateway to activate your subscription.
              </p>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center">
              <div>
                <span className="text-xs text-gray-400">Total Due:</span>
                <div className="text-2xl font-black text-white">${checkoutModal.amount} <span className="text-xs font-normal text-gray-400">USD</span></div>
              </div>
              <div className="text-xs text-right text-cyan-400 font-semibold">
                Instant Activation • Cancel Anytime
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Choose Gateway:</label>
              
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
    </div>
  );
}
