'use client';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Star, Zap } from 'lucide-react';
import { useState } from 'react';

export default function PricingPage() {
  const [loading, setLoading] = useState(false);

  const handleCheckout = async (plan: string, amount: number) => {
    setLoading(true);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ plan, amount, email: 'user@example.com' })
      });
      const data = await res.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (e) {
      console.error('Checkout failed', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-gray-900">Upgrade to Pro</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Unlock the full power of Job Hub AI. Generate better resumes, source top candidates, and accelerate your hiring.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="p-8 border-2 hover:border-blue-400 transition">
          <CardHeader className="p-0 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Star className="text-blue-500" /> AI Pro (Candidates)</h3>
            <div className="mt-4 text-4xl font-black">$19<span className="text-lg text-gray-500 font-normal">/mo</span></div>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <ul className="space-y-4">
              {['Unlimited AI Resume Tailoring', 'Unlimited Cover Letters', 'Advanced Career Health Insights', 'Priority Application Ranking'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-blue-500" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => handleCheckout('AI_PRO', 19)} 
              disabled={loading}
              className="w-full bg-blue-600 text-lg h-12"
            >
              {loading ? 'Processing...' : 'Upgrade Now'}
            </Button>
          </CardContent>
        </Card>

        <Card className="p-8 border-2 border-indigo-600 shadow-xl relative">
          <div className="absolute top-0 right-0 bg-indigo-600 text-white px-4 py-1 rounded-bl-xl rounded-tr-xl text-sm font-bold">
            RECOMMENDED
          </div>
          <CardHeader className="p-0 mb-6">
            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><Zap className="text-indigo-500" /> Premium Employer</h3>
            <div className="mt-4 text-4xl font-black">$199<span className="text-lg text-gray-500 font-normal">/mo</span></div>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
            <ul className="space-y-4">
              {['Unlimited Job Postings', 'Access to Talent Marketplace', 'Advanced CRM Pipeline Tools', 'AI Candidate Fraud Detection'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-indigo-500" />
                  <span className="text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
            <Button 
              onClick={() => handleCheckout('PREMIUM_EMPLOYER', 199)}
              disabled={loading}
              className="w-full bg-indigo-600 text-lg h-12"
            >
              {loading ? 'Processing...' : 'Subscribe'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
