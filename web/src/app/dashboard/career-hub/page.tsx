'use client';
import Link from 'next/link';
import { 
  FileText, Activity, Wallet, History, Users, ShoppingBag, 
  Bot, Sparkles, ArrowRight, CheckCircle2, ShieldCheck 
} from 'lucide-react';

export default function CareerHubPage() {
  const hubTools = [
    {
      title: 'AI Resume Builder',
      description: 'Build ATS-optimized resumes from your profile data with 1-click PDF download & export.',
      icon: FileText,
      href: '/dashboard/resumes',
      badge: 'Core Tool',
      color: 'from-blue-500 to-cyan-500',
      actionText: 'Manage Resumes'
    },
    {
      title: 'Career Health Analytics',
      description: 'Analyze your profile strength, market salary benchmark, and discover skill gap recommendations.',
      icon: Activity,
      href: '/dashboard/profile/health',
      badge: 'AI Powered',
      color: 'from-emerald-500 to-teal-500',
      actionText: 'View Health Score'
    },
    {
      title: 'Digital Credential Wallet',
      description: 'Securely upload and verify your university degrees, professional certifications, and licenses.',
      icon: Wallet,
      href: '/dashboard/wallet',
      badge: 'Verified',
      color: 'from-purple-500 to-indigo-500',
      actionText: 'Open Wallet'
    },
    {
      title: 'Career Timeline',
      description: 'Visualize your professional journey, career milestones, promotions, and achievements.',
      icon: History,
      href: '/dashboard/profile/timeline',
      badge: 'Visualizer',
      color: 'from-amber-500 to-orange-500',
      actionText: 'View Timeline'
    },
    {
      title: 'Professional Network',
      description: 'Connect with peers, share project updates, discuss tech patterns, and grow your network.',
      icon: Users,
      href: '/dashboard/network',
      badge: 'Social Feed',
      color: 'from-pink-500 to-rose-500',
      actionText: 'Join Network'
    },
    {
      title: 'Career Marketplace',
      description: 'Explore featured job postings, freelance contracts, and premium hiring opportunities.',
      icon: ShoppingBag,
      href: '/dashboard/marketplace',
      badge: 'Opportunities',
      color: 'from-blue-600 to-indigo-600',
      actionText: 'Explore Roles'
    },
    {
      title: 'AI Career Mentor',
      description: 'Get 24/7 personalized coaching, interview practice questions, and salary negotiation strategies.',
      icon: Bot,
      href: '/dashboard/mentor',
      badge: '24/7 AI Coach',
      color: 'from-cyan-400 to-blue-500',
      actionText: 'Chat with Mentor'
    }
  ];

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> All-in-One Career Suite
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight">
            AI Career Hub
          </h1>
          <p className="text-gray-400 mt-2 max-w-2xl text-base">
            Access your full suite of career acceleration tools — from intelligent resume generation to verified credentials and peer networking.
          </p>
        </div>
        
        <Link href="/dashboard/resumes/builder">
          <button className="btn-primary" style={{ background: 'linear-gradient(135deg, #00f0ff 0%, #0080ff 100%)', color: '#000', fontWeight: 'bold', padding: '12px 24px' }}>
            ✨ Build New Resume
          </button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hubTools.map((tool) => {
          const Icon = tool.icon;
          return (
            <div 
              key={tool.title}
              className="group relative rounded-2xl border border-white/10 bg-[#161026] p-6 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${tool.color} flex items-center justify-center text-white shadow-lg`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-white/[0.08] text-cyan-300 border border-white/10">
                    {tool.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition">
                  {tool.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed mb-6">
                  {tool.description}
                </p>
              </div>

              <Link 
                href={tool.href}
                className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 group-hover:text-cyan-300 transition"
              >
                {tool.actionText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
