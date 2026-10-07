'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { Sparkles, Briefcase, FileText, Bot, Wallet, Globe, Users, Shield, PlusCircle, User } from 'lucide-react';

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const userData = await res.json();
          setUser(userData);
          
          const endpoint = userData.role === 'JOB_SEEKER' ? '/profiles/job-seeker' : '/profiles/employer';
          const profRes = await fetch(`/api${endpoint}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (profRes.ok) {
            setProfile(await profRes.json());
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center px-4 md:px-8 py-3 bg-white/80 dark:bg-[#120B1C]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 transition-colors duration-300">
      {/* Left: Logo and App Name */}
      <Link href="/" className="flex items-center gap-3 no-underline" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
        <img 
          src="/icon.svg" 
          alt="JobHub AI Logo" 
          width="36" 
          height="36" 
          style={{ width: '36px', height: '36px', maxWidth: '36px', maxHeight: '36px', objectFit: 'contain', borderRadius: '8px' }} 
        />
        <span className="text-xl md:text-2xl font-black text-gradient" style={{ fontSize: '1.5rem', fontWeight: 900 }}>JobHub AI</span>
      </Link>

      {/* Center: Navigation Links when Logged In */}
      {user && (
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium">
          {user.role === 'JOB_SEEKER' ? (
            <>
              <Link href="/jobs" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> Jobs
              </Link>
              <Link href="/dashboard/resumes" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> AI Resumes
              </Link>
              <Link href="/dashboard/mentor" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-500" /> AI Mentor
              </Link>
              <Link href="/dashboard/wallet" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Wallet className="w-4 h-4" /> Credentials
              </Link>
              <Link href="/dashboard/network" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Network
              </Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <User className="w-4 h-4" /> Profile
              </Link>
            </>
          ) : user.role === 'EMPLOYER' ? (
            <>
              <Link href="/applications" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Briefcase className="w-4 h-4" /> Postings & Chats
              </Link>
              <Link href="/dashboard/employer/jobs/new" className="px-3 py-1.5 rounded-lg text-indigo-600 dark:text-cyan-400 font-semibold hover:bg-indigo-50 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4" /> Post Job (AI)
              </Link>
              <Link href="/dashboard/employer/crm" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Users className="w-4 h-4" /> Recruiter CRM
              </Link>
              <Link href="/dashboard/employer/talent" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Talent Search
              </Link>
              <Link href="/profile" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <User className="w-4 h-4" /> Company
              </Link>
            </>
          ) : (
            <>
              <Link href="/admin" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-cyan-400 hover:bg-gray-100 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-purple-500" /> Admin Users
              </Link>
              <Link href="/admin/fraud" className="px-3 py-1.5 rounded-lg text-red-600 font-semibold hover:bg-red-50 dark:hover:bg-white/5 transition flex items-center gap-1.5">
                Fraud Queue
              </Link>
            </>
          )}
        </nav>
      )}

      {/* Right: Theme Toggle & User Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {!user ? (
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 rounded-lg text-gray-700 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-white/10 transition">
              Log In
            </Link>
            <Link href="/register" className="btn-primary text-sm py-2 px-4">
              Sign Up
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/pricing" className="px-3 py-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 font-bold hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition text-sm">
              Upgrade
            </Link>
            <button 
              className="px-3 py-1.5 text-sm text-red-500 hover:text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition"
              onClick={() => {
                localStorage.removeItem('token');
                window.location.href = '/login';
              }}
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
