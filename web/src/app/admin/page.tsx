'use client';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';

interface UserData {
  id: string;
  email: string;
  role: 'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN';
  subscriptionTier: 'FREE' | 'SILVER' | 'PREMIUM';
  accountStatus: string;
  isFlagged: boolean;
  flagReason?: string;
  fraudScore?: number;
  freeGenerationsUsed: number;
  createdAt: string;
  updatedAt: string;
  jobSeekerProfile?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    otherNames?: string;
    gender?: string;
    profession?: string;
    phone?: string;
    residenceCountry?: string;
    residenceState?: string;
    residenceCity?: string;
    citizenshipCountry?: string;
    dateOfBirth?: string;
    skills?: string[];
    desiredJobTitle?: string;
    bio?: string;
    headline?: string;
    willingToRelocate?: boolean;
    autoApplyEnabled?: boolean;
    experience?: any;
    education?: any;
    profilePicture?: string;
  };
  employer?: {
    id?: string;
    companyName?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    website?: string;
    profilePicture?: string;
    locationCountry?: string;
    locationState?: string;
    locationCity?: string;
    hrContactName?: string;
    hrEmail?: string;
    hrPhone?: string;
    registrationNumber?: string;
    taxId?: string;
    jobs?: Array<{
      id: string;
      title: string;
      isRemote?: boolean;
      location?: string;
      createdAt: string;
    }>;
  };
  _count?: {
    payments?: number;
    notifications?: number;
    sentMessages?: number;
  };
}

interface SupportInquiryData {
  id: string;
  userId?: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    email: string;
    role: string;
    jobSeekerProfile?: {
      firstName?: string;
      lastName?: string;
      phone?: string;
    };
    employer?: {
      companyName?: string;
      hrPhone?: string;
    };
  };
}

const resolvePicUrl = (path?: string) => {
  if (!path || !path.trim()) return null;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  if (path.startsWith('/')) return path;
  return `/${path}`;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'USERS' | 'INQUIRIES'>('USERS');
  const [users, setUsers] = useState<UserData[]>([]);
  const [inquiries, setInquiries] = useState<SupportInquiryData[]>([]);
  const [loadingInquiries, setLoadingInquiries] = useState(false);
  const [inquirySearchQuery, setInquirySearchQuery] = useState('');
  const [inquiryStatusFilter, setInquiryStatusFilter] = useState('ALL');
  const [selectedInquiry, setSelectedInquiry] = useState<SupportInquiryData | null>(null);
  const [isUpdatingInquiry, setIsUpdatingInquiry] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [tierFilter, setTierFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<'JOB_SEEKER' | 'EMPLOYER' | 'ADMIN'>('JOB_SEEKER');
  const [editTier, setEditTier] = useState<'FREE' | 'SILVER' | 'PREMIUM'>('FREE');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editFlagged, setEditFlagged] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);


  const fetchUsers = async () => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      setIsAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const [usersRes, statsRes, aiRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/ai/admin/monitoring', { headers: { Authorization: `Bearer ${token}` } }).catch(() => null),
      ]);

      if (usersRes.status === 401 || statsRes.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (aiRes && aiRes.ok) {
        const aiData = await aiRes.json();
        setAiStats(aiData);
      }
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error connecting to admin service: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchInquiries = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;
    setLoadingInquiries(true);
    try {
      const res = await fetch('/api/admin/inquiries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInquiries(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInquiries(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchInquiries();
  }, []);

  const handleUpdateInquiryStatus = async (id: string, newStatus: string) => {
    setIsUpdatingInquiry(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/inquiries/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification('success', `Inquiry status changed to ${newStatus}`);
        fetchInquiries();
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry({ ...selectedInquiry, status: newStatus });
        }
      } else {
        showNotification('error', 'Failed to update inquiry status');
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setIsUpdatingInquiry(false);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this inquiry?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/inquiries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification('success', 'Support inquiry permanently deleted.');
        setInquiries((prev) => prev.filter((i) => i.id !== id));
        if (selectedInquiry && selectedInquiry.id === id) {
          setSelectedInquiry(null);
        }
      } else {
        showNotification('error', 'Failed to delete inquiry');
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showNotification('success', `User status updated to ${newStatus}`);
        fetchUsers();
      } else {
        showNotification('error', 'Failed to update user status');
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  const handleDeleteUser = async (user: UserData) => {
    const displayName = user.jobSeekerProfile
      ? `${user.jobSeekerProfile.firstName || ''} ${user.jobSeekerProfile.lastName || ''}`.trim()
      : user.employer?.companyName || user.email;

    if (!confirm(`Are you sure you want to PERMANENTLY delete user "${displayName}" (${user.email})? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        showNotification('success', `User "${displayName}" permanently deleted.`);
        if (selectedUser?.id === user.id) setSelectedUser(null);
        fetchUsers();
      } else {
        let errorMsg = 'Failed to delete user';
        try {
          const errData = await res.json();
          if (errData && errData.message) errorMsg = errData.message;
        } catch (_) {}
        showNotification('error', errorMsg);
      }
    } catch (e: any) {
      showNotification('error', e.message || 'Network error deleting user');
    }
  };

  const openEditModal = (user: UserData) => {
    setEditingUser(user);
    setEditRole(user.role);
    setEditTier(user.subscriptionTier);
    setEditStatus(user.accountStatus || 'ACTIVE');
    setEditFlagged(Boolean(user.isFlagged));
  };

  const handleSaveUserEdit = async () => {
    if (!editingUser) return;
    setIsSavingEdit(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/users/${editingUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          role: editRole,
          subscriptionTier: editTier,
          accountStatus: editStatus,
          isFlagged: editFlagged,
        }),
      });

      if (res.ok) {
        showNotification('success', `User ${editingUser.email} updated successfully!`);
        setEditingUser(null);
        fetchUsers();
      } else {
        showNotification('error', 'Failed to update user details.');
      }
    } catch (e: any) {
      showNotification('error', e.message);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const seekerName = `${u.jobSeekerProfile?.firstName || ''} ${u.jobSeekerProfile?.lastName || ''}`.toLowerCase();
      const companyName = (u.employer?.companyName || '').toLowerCase();
      const email = u.email.toLowerCase();
      const phone = (u.jobSeekerProfile?.phone || u.employer?.hrPhone || '').toLowerCase();

      const matchesSearch = !q || email.includes(q) || seekerName.includes(q) || companyName.includes(q) || phone.includes(q);
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesTier = tierFilter === 'ALL' || u.subscriptionTier === tierFilter;
      const matchesStatus = statusFilter === 'ALL' || u.accountStatus === statusFilter;

      return matchesSearch && matchesRole && matchesTier && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, tierFilter, statusFilter]);

  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inq) => {
      const q = inquirySearchQuery.toLowerCase().trim();
      const name = (inq.name || '').toLowerCase();
      const email = (inq.email || '').toLowerCase();
      const subject = (inq.subject || '').toLowerCase();
      const message = (inq.message || '').toLowerCase();
      const category = (inq.category || '').toLowerCase();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || subject.includes(q) || message.includes(q) || category.includes(q);
      const matchesStatus = inquiryStatusFilter === 'ALL' || inq.status === inquiryStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [inquiries, inquirySearchQuery, inquiryStatusFilter]);


  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}></span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                JobHub <span style={{ background: 'linear-gradient(90deg, #6366F1, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Control Center</span>
              </h1>
            </div>
            <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
              Real-time user intelligence, verification, data management, and platform governance
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={fetchUsers}
              disabled={loading}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
               Refresh Data
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/applications';
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                color: '#6366F1',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              Exit to App
            </button>
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            style={{
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              backgroundColor: message.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${message.type === 'success' ? '#10B981' : '#EF4444'}`,
              color: message.type === 'success' ? '#10B981' : '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
          </div>
        )}

        {/* Authentication Notice if Guest / Not Logged In */}
        {isAuthenticated === false && !loading && (
          <div
            style={{
              padding: '2.5rem 2rem',
              borderRadius: '20px',
              backgroundColor: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              textAlign: 'center',
              marginBottom: '2rem',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}></div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F87171' }}>
              Administrator Authentication Required
            </h2>
            <p style={{ color: 'rgba(255, 255, 255, 0.75)', maxWidth: '640px', margin: '0 auto 1.5rem', lineHeight: '1.6', fontSize: '1rem' }}>
              User records, personal information, and platform analytics are securely protected and only accessible to signed-in administrators. You are currently viewing this page unauthenticated (guest mode), which is why the metrics and tables show 0.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                style={{
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: 'white',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                 Log In as Administrator
              </Link>
              <button
                onClick={fetchUsers}
                style={{
                  padding: '0.85rem 1.5rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  color: 'white',
                  fontWeight: 600,
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: 'pointer',
                }}
              >
                 Refresh Session
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}></div>
            <div>Loading JobHub Global platform intelligence and user database...</div>
          </div>
        )}

        {/* KPI Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Users</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: 'white' }}>{stats?.totalUsers ?? users.length}</div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>Active platform accounts</div>
          </div>

          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ color: '#818CF8', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Job Seekers</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#818CF8' }}>
              {stats?.jobSeekers ?? users.filter(u => u.role === 'JOB_SEEKER').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>Candidates seeking jobs</div>
          </div>

          <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ color: '#00F0FF', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employers & Recruiters</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#00F0FF' }}>
              {stats?.employers ?? users.filter(u => u.role === 'EMPLOYER').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>Posting companies</div>
          </div>

          <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ color: '#FBBF24', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid Subscribers</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#FBBF24' }}>
              {stats?.paidUsers ?? users.filter(u => u.subscriptionTier !== 'FREE').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>
              Silver: {stats?.silverUsers ?? users.filter(u => u.subscriptionTier === 'SILVER').length} | Premium: {stats?.premiumUsers ?? users.filter(u => u.subscriptionTier === 'PREMIUM').length}
            </div>
          </div>

          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '16px', padding: '1.25rem' }}>
            <div style={{ color: '#F87171', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspended Accounts</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '0.5rem', color: '#F87171' }}>
              {stats?.suspendedUsers ?? users.filter(u => u.accountStatus === 'SUSPENDED').length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.25rem' }}>Restricted access</div>
          </div>
        </div>

        {/* Production AI Monitoring & Gemini Quota Telemetry */}
        <div style={{ backgroundColor: 'rgba(0, 240, 255, 0.03)', border: '1px solid rgba(0, 240, 255, 0.2)', borderRadius: '16px', padding: '1.25rem 1.5rem', marginBottom: '2rem', backdropFilter: 'blur(10px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}></span>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#00F0FF', fontWeight: 700 }}>AI Engine & Gemini Token Telemetry</h3>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              Rate Limiting & Tier Quotas: <span style={{ color: '#10B981', fontWeight: 600 }}>Active (Free: 1 | Silver: 15 | Diamond: Unlimited)</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Total AI Generations</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', marginTop: '0.25rem' }}>{aiStats?.totalApiCalls ?? 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#00F0FF', marginTop: '0.2rem' }}>Gemini API Invocations</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Est. Tokens Consumed</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8', marginTop: '0.25rem' }}>
                {(aiStats?.totalTokensEstimated ?? 0).toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>Input + Generated output</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Est. Gemini API Cost</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981', marginTop: '0.25rem' }}>
                ${(aiStats?.totalEstimatedCostUsd ?? 0).toFixed(4)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem' }}>Standard 1.5 Flash rates</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase' }}>Calls by Tier</div>
              <div style={{ fontSize: '0.85rem', color: 'white', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                <span>Free: <strong style={{ color: '#94A3B8' }}>{aiStats?.callsByTier?.FREE ?? 0}</strong></span>
                <span>Silver: <strong style={{ color: '#00F0FF' }}>{aiStats?.callsByTier?.SILVER ?? 0}</strong></span>
                <span>Diamond: <strong style={{ color: '#C084FC' }}>{aiStats?.callsByTier?.PREMIUM ?? 0}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('USERS')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'USERS' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'USERS' ? '#00F0FF' : 'rgba(255, 255, 255, 0.7)',
              border: activeTab === 'USERS' ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            👥 Platform Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('INQUIRIES')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'INQUIRIES' ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.04)',
              color: activeTab === 'INQUIRIES' ? '#00F0FF' : 'rgba(255, 255, 255, 0.7)',
              border: activeTab === 'INQUIRIES' ? '1px solid rgba(0, 240, 255, 0.5)' : '1px solid rgba(255, 255, 255, 0.1)',
              padding: '0.75rem 1.4rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            📩 Support & Enquiries ({inquiries.length})
            {inquiries.filter((i) => i.status === 'OPEN').length > 0 && (
              <span
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  marginLeft: '4px',
                }}
              >
                {inquiries.filter((i) => i.status === 'OPEN').length} New
              </span>
            )}
          </button>
        </div>

        {activeTab === 'USERS' && (
          <>
            {/* Filter and Search Bar */}
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '16px',
                padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by email, candidate name, company, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginBottom: '0.2rem' }}>ROLE</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <option value="ALL">All Roles</option>
                <option value="JOB_SEEKER">Job Seekers</option>
                <option value="EMPLOYER">Employers</option>
                <option value="ADMIN">Admins</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginBottom: '0.2rem' }}>TIER</label>
              <select
                value={tierFilter}
                onChange={(e) => setTierFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <option value="ALL">All Tiers</option>
                <option value="FREE">Free</option>
                <option value="SILVER">Silver</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginBottom: '0.2rem' }}>STATUS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            {(searchQuery || roleFilter !== 'ALL' || tierFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setRoleFilter('ALL');
                  setTierFilter('ALL');
                  setStatusFilter('ALL');
                }}
                style={{
                  marginTop: '1.2rem',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.85rem',
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
          Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
        </div>

        {/* Users Table */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}></div>
              <div>Loading users database...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}></div>
              <div>No users found matching your filters.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', color: 'rgba(255, 255, 255, 0.6)' }}>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600 }}>USER & PROFILE</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>ROLE</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>SUBSCRIPTION</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>STATUS</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>LOCATION / CONTACT</th>
                    <th style={{ padding: '1rem', fontWeight: 600 }}>JOINED</th>
                    <th style={{ padding: '1rem 1.25rem', fontWeight: 600, textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => {
                    const isSeeker = user.role === 'JOB_SEEKER';
                    const isEmployer = user.role === 'EMPLOYER';
                    const fullName = isSeeker
                      ? `${user.jobSeekerProfile?.firstName || ''} ${user.jobSeekerProfile?.lastName || ''}`.trim()
                      : isEmployer
                      ? user.employer?.companyName || 'Employer'
                      : 'Platform Administrator';
                    const phone = user.jobSeekerProfile?.phone || user.employer?.hrPhone || '—';
                    const location = isSeeker
                      ? [user.jobSeekerProfile?.residenceCity, user.jobSeekerProfile?.residenceCountry].filter(Boolean).join(', ') || '—'
                      : [user.employer?.locationCity, user.employer?.locationCountry].filter(Boolean).join(', ') || '—';

                    return (
                      <tr
                        key={user.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        {/* User & Profile */}
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {(() => {
                              const picUrl = resolvePicUrl(user.jobSeekerProfile?.profilePicture || user.employer?.profilePicture);
                              return (
                                <div
                                  style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: isSeeker ? '#4338CA' : isEmployer ? '#0891B2' : '#B45309',
                                    color: 'white',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    flexShrink: 0,
                                    overflow: 'hidden',
                                    position: 'relative',
                                    border: '1.5px solid rgba(255, 255, 255, 0.15)',
                                  }}
                                >
                                  {picUrl && (
                                    <img
                                      src={picUrl}
                                      alt={fullName || user.email}
                                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                      onError={(e) => {
                                        (e.currentTarget as HTMLElement).style.display = 'none';
                                        const fallback = e.currentTarget.parentElement?.querySelector('.avatar-fallback') as HTMLElement | null;
                                        if (fallback) fallback.style.display = 'flex';
                                      }}
                                    />
                                  )}
                                  <span
                                    className="avatar-fallback"
                                    style={{
                                      display: picUrl ? 'none' : 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      width: '100%',
                                      height: '100%',
                                    }}
                                  >
                                    {(fullName || user.email)[0].toUpperCase()}
                                  </span>
                                </div>
                              );
                            })()}
                            <div>
                              <div style={{ fontWeight: 600, color: 'white' }}>{fullName || user.email}</div>
                              <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.5)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                user.role === 'JOB_SEEKER'
                                  ? 'rgba(99, 102, 241, 0.15)'
                                  : user.role === 'EMPLOYER'
                                  ? 'rgba(0, 240, 255, 0.15)'
                                  : 'rgba(245, 158, 11, 0.15)',
                              color:
                                user.role === 'JOB_SEEKER'
                                  ? '#818CF8'
                                  : user.role === 'EMPLOYER'
                                  ? '#00F0FF'
                                  : '#FBBF24',
                              border: `1px solid ${
                                user.role === 'JOB_SEEKER'
                                  ? 'rgba(99, 102, 241, 0.3)'
                                  : user.role === 'EMPLOYER'
                                  ? 'rgba(0, 240, 255, 0.3)'
                                  : 'rgba(245, 158, 11, 0.3)'
                              }`,
                            }}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Subscription Tier */}
                        <td style={{ padding: '1rem' }}>
                          <span
                            style={{
                              padding: '0.3rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor:
                                user.subscriptionTier === 'PREMIUM'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : user.subscriptionTier === 'SILVER'
                                  ? 'rgba(156, 163, 175, 0.15)'
                                  : 'rgba(255, 255, 255, 0.05)',
                              color:
                                user.subscriptionTier === 'PREMIUM'
                                  ? '#FBBF24'
                                  : user.subscriptionTier === 'SILVER'
                                  ? '#D1D5DB'
                                  : 'rgba(255, 255, 255, 0.6)',
                              border: `1px solid ${
                                user.subscriptionTier === 'PREMIUM'
                                  ? 'rgba(245, 158, 11, 0.3)'
                                  : user.subscriptionTier === 'SILVER'
                                  ? 'rgba(156, 163, 175, 0.3)'
                                  : 'rgba(255, 255, 255, 0.1)'
                              }`,
                            }}
                          >
                            {user.subscriptionTier}
                          </span>
                        </td>

                        {/* Status */}
                        <td style={{ padding: '1rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                backgroundColor: user.accountStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                color: user.accountStatus === 'ACTIVE' ? '#10B981' : '#EF4444',
                              }}
                            >
                               {user.accountStatus}
                            </span>
                            {user.isFlagged && (
                              <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}> Flagged</span>
                            )}
                          </div>
                        </td>

                        {/* Location / Contact */}
                        <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          <div> {location}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.15rem' }}> {phone}</div>
                        </td>

                        {/* Joined Date */}
                        <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                          {new Date(user.createdAt).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Action Buttons */}
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setSelectedUser(user)}
                              title="View all user details"
                              style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.15)',
                                color: 'white',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Details
                            </button>

                            <button
                              onClick={() => openEditModal(user)}
                              title="Edit user role, tier, and status"
                              style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                color: '#818CF8',
                                padding: '0.4rem 0.75rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Edit
                            </button>

                            {user.accountStatus === 'ACTIVE' ? (
                              <button
                                onClick={() => handleUpdateStatus(user.id, 'SUSPENDED')}
                                title="Suspend user access"
                                style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#EF4444',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateStatus(user.id, 'ACTIVE')}
                                title="Restore active access"
                                style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  color: '#10B981',
                                  padding: '0.4rem 0.75rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Activate
                              </button>
                            )}

                            <button
                              onClick={() => handleDeleteUser(user)}
                              title="Permanently delete user"
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                color: '#EF4444',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                            >
                              
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )}

    {/* Support & Enquiries Tab */}
    {activeTab === 'INQUIRIES' && (
      <>
        {/* Inquiries Filter & Search Bar */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Search Box */}
          <div style={{ flex: '1 1 320px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search enquiries by name, email, subject, message, or category..."
              value={inquirySearchQuery}
              onChange={(e) => setInquirySearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.8rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: '0.95rem',
                outline: 'none',
              }}
            />
          </div>

          {/* Filter Dropdown */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', display: 'block', marginBottom: '0.2rem' }}>STATUS</label>
              <select
                value={inquiryStatusFilter}
                onChange={(e) => setInquiryStatusFilter(e.target.value)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.06)',
                  color: 'white',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  padding: '0.6rem 0.9rem',
                  borderRadius: '10px',
                  outline: 'none',
                  fontSize: '0.85rem',
                }}
              >
                <option value="ALL">All Statuses ({inquiries.length})</option>
                <option value="OPEN">Open ({inquiries.filter((i) => i.status === 'OPEN').length})</option>
                <option value="IN_PROGRESS">In Progress ({inquiries.filter((i) => i.status === 'IN_PROGRESS').length})</option>
                <option value="RESOLVED">Resolved ({inquiries.filter((i) => i.status === 'RESOLVED').length})</option>
              </select>
            </div>

            <button
              onClick={fetchInquiries}
              disabled={loadingInquiries}
              style={{
                marginTop: '1.2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '0.6rem 1rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              🔄 Refresh Enquiries
            </button>

            {(inquirySearchQuery || inquiryStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setInquirySearchQuery('');
                  setInquiryStatusFilter('ALL');
                }}
                style={{
                  marginTop: '1.2rem',
                  backgroundColor: 'transparent',
                  color: 'rgba(255, 255, 255, 0.6)',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  fontSize: '0.85rem',
                }}
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* Results Counter */}
        <div style={{ marginBottom: '1rem', color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.9rem' }}>
          Showing <strong>{filteredInquiries.length}</strong> of <strong>{inquiries.length}</strong> enquiries
        </div>

        {/* Inquiries Table */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            overflow: 'hidden',
          }}
        >
          {loadingInquiries ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div>Loading support tickets & enquiries...</div>
            </div>
          ) : filteredInquiries.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>No Support Enquiries Found</div>
              <div style={{ fontSize: '0.9rem' }}>
                {inquiries.length === 0
                  ? 'No user has submitted any support enquiries yet. When users submit via mobile or web Support & Inquiries, tickets will automatically appear here.'
                  : 'No enquiries match your active search filters.'}
              </div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>STATUS</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>DATE & TIME</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>SENDER / CONTACT</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>CATEGORY</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>SUBJECT & MESSAGE</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>USER RECORD</th>
                    <th style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.5)', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', textAlign: 'right' }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInquiries.map((inq) => {
                    const statusColor =
                      inq.status === 'RESOLVED'
                        ? '#10B981'
                        : inq.status === 'IN_PROGRESS'
                        ? '#60A5FA'
                        : '#F59E0B';
                    const statusBg =
                      inq.status === 'RESOLVED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : inq.status === 'IN_PROGRESS'
                        ? 'rgba(96, 165, 250, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)';

                    return (
                      <tr
                        key={inq.id}
                        style={{
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          transition: 'background-color 0.15s',
                        }}
                      >
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              backgroundColor: statusBg,
                              color: statusColor,
                              border: `1px solid ${statusColor}40`,
                            }}
                          >
                            {inq.status}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {new Date(inq.createdAt).toLocaleString(undefined, {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <div style={{ fontWeight: 600, color: 'white' }}>{inq.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#00F0FF' }}>{inq.email}</div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              backgroundColor: 'rgba(99, 102, 241, 0.15)',
                              color: '#A5B4FC',
                              border: '1px solid rgba(99, 102, 241, 0.3)',
                            }}
                          >
                            {inq.category || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem 1.25rem', maxWidth: '340px' }}>
                          <div style={{ fontWeight: 600, color: 'white', marginBottom: '0.2rem' }}>
                            {inq.subject}
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: 'rgba(255, 255, 255, 0.6)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {inq.message}
                          </div>
                        </td>
                        <td style={{ padding: '1rem 1.25rem' }}>
                          {inq.user ? (
                            <div>
                              <span
                                style={{
                                  fontSize: '0.7rem',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: inq.user.role === 'EMPLOYER' ? '#10B98125' : '#6366F125',
                                  color: inq.user.role === 'EMPLOYER' ? '#10B981' : '#818CF8',
                                  fontWeight: 700,
                                }}
                              >
                                {inq.user.role}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '2px' }}>
                                {inq.user.jobSeekerProfile
                                  ? `${inq.user.jobSeekerProfile.firstName || ''} ${inq.user.jobSeekerProfile.lastName || ''}`.trim()
                                  : inq.user.employer?.companyName || inq.user.email}
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.4)' }}>Guest / App User</span>
                          )}
                        </td>
                        <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => setSelectedInquiry(inq)}
                              style={{
                                backgroundColor: 'rgba(99, 102, 241, 0.15)',
                                color: '#A5B4FC',
                                border: '1px solid rgba(99, 102, 241, 0.3)',
                                padding: '0.4rem 0.8rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                fontWeight: 600,
                              }}
                            >
                              View Details
                            </button>
                            {inq.status !== 'RESOLVED' ? (
                              <button
                                onClick={() => handleUpdateInquiryStatus(inq.id, 'RESOLVED')}
                                disabled={isUpdatingInquiry}
                                style={{
                                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                                  color: '#10B981',
                                  border: '1px solid rgba(16, 185, 129, 0.3)',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                              >
                                Mark Resolved
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateInquiryStatus(inq.id, 'OPEN')}
                                disabled={isUpdatingInquiry}
                                style={{
                                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                                  color: '#F59E0B',
                                  border: '1px solid rgba(245, 158, 11, 0.3)',
                                  padding: '0.4rem 0.8rem',
                                  borderRadius: '8px',
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  fontWeight: 600,
                                }}
                              >
                                Reopen
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteInquiry(inq.id)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#EF4444',
                                padding: '0.4rem 0.6rem',
                                borderRadius: '8px',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                              }}
                              title="Delete inquiry"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )}

    {/* Support Inquiry Details Modal */}
    {selectedInquiry && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          zIndex: 9999,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            backgroundColor: '#161616',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '2rem',
            position: 'relative',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                <span
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor:
                      selectedInquiry.status === 'RESOLVED'
                        ? 'rgba(16, 185, 129, 0.15)'
                        : selectedInquiry.status === 'IN_PROGRESS'
                        ? 'rgba(96, 165, 250, 0.15)'
                        : 'rgba(245, 158, 11, 0.15)',
                    color:
                      selectedInquiry.status === 'RESOLVED'
                        ? '#10B981'
                        : selectedInquiry.status === 'IN_PROGRESS'
                        ? '#60A5FA'
                        : '#F59E0B',
                  }}
                >
                  {selectedInquiry.status}
                </span>
                <span
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(99, 102, 241, 0.2)',
                    color: '#A5B4FC',
                  }}
                >
                  {selectedInquiry.category || 'General'}
                </span>
              </div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'white' }}>
                {selectedInquiry.subject}
              </h2>
            </div>
            <button
              onClick={() => setSelectedInquiry(null)}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.5)',
                fontSize: '1.5rem',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>

          {/* Sender & Timestamp */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              padding: '1rem',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              marginBottom: '1.5rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>SUBMITTER NAME</div>
              <div style={{ fontWeight: 600, color: 'white', marginTop: '2px' }}>{selectedInquiry.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>EMAIL ADDRESS</div>
              <div style={{ fontWeight: 600, color: '#00F0FF', marginTop: '2px' }}>
                <a href={`mailto:${selectedInquiry.email}`} style={{ color: '#00F0FF', textDecoration: 'none' }}>
                  {selectedInquiry.email} ↗
                </a>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>SUBMITTED AT</div>
              <div style={{ color: 'white', marginTop: '2px', fontSize: '0.85rem' }}>
                {new Date(selectedInquiry.createdAt).toLocaleString()}
              </div>
            </div>
            {selectedInquiry.user && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)' }}>ACCOUNT ROLE</div>
                <div style={{ color: '#A5B4FC', fontWeight: 600, marginTop: '2px', fontSize: '0.85rem' }}>
                  {selectedInquiry.user.role} ({selectedInquiry.user.jobSeekerProfile?.phone || selectedInquiry.user.employer?.hrPhone || 'No phone'})
                </div>
              </div>
            )}
          </div>

          {/* Full Message Box */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.5)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Enquiry Message Content
            </label>
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '1.25rem',
                color: 'white',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                whiteSpace: 'pre-wrap',
              }}
            >
              {selectedInquiry.message}
            </div>
          </div>

          {/* Actions Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
            <button
              onClick={() => handleDeleteInquiry(selectedInquiry.id)}
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Delete Inquiry
            </button>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {selectedInquiry.status !== 'IN_PROGRESS' && (
                <button
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'IN_PROGRESS')}
                  style={{
                    backgroundColor: 'rgba(59, 130, 246, 0.2)',
                    color: '#60A5FA',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  Set In Progress
                </button>
              )}
              {selectedInquiry.status !== 'RESOLVED' ? (
                <button
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'RESOLVED')}
                  style={{
                    backgroundColor: '#10B981',
                    color: '#000',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  ✓ Mark as Resolved
                </button>
              ) : (
                <button
                  onClick={() => handleUpdateInquiryStatus(selectedInquiry.id, 'OPEN')}
                  style={{
                    backgroundColor: '#F59E0B',
                    color: '#000',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  ↺ Reopen Ticket
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* User Details Modal */}
        {selectedUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#120B1C',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                maxWidth: '750px',
                width: '100%',
                maxHeight: '85vh',
                overflowY: 'auto',
                padding: '2rem',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setSelectedUser(null)}
                style={{
                  position: 'absolute',
                  top: '1.25rem',
                  right: '1.25rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: 'none',
                  color: 'white',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                }}
              >
                ✕
              </button>

              {(() => {
                const modalPicUrl = resolvePicUrl(selectedUser.jobSeekerProfile?.profilePicture || selectedUser.employer?.profilePicture);
                return (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        backgroundColor: '#6366F1',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '1.4rem',
                        overflow: 'hidden',
                        flexShrink: 0,
                        position: 'relative',
                        border: '2px solid rgba(0, 240, 255, 0.4)',
                      }}
                    >
                      {modalPicUrl && (
                        <img
                          src={modalPicUrl}
                          alt={selectedUser.email}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.modal-avatar-fallback') as HTMLElement | null;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      )}
                      <span
                        className="modal-avatar-fallback"
                        style={{
                          display: modalPicUrl ? 'none' : 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          height: '100%',
                        }}
                      >
                        {selectedUser.email[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                        {selectedUser.jobSeekerProfile
                          ? `${selectedUser.jobSeekerProfile.firstName || ''} ${selectedUser.jobSeekerProfile.lastName || ''}`.trim() || selectedUser.email
                          : selectedUser.employer?.companyName || selectedUser.email}
                      </h2>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' }}>
                        {selectedUser.email} • ID: <code style={{ color: '#00F0FF' }}>{selectedUser.id}</code>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Badges Bar */}
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                <span style={{ backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Role: {selectedUser.role}
                </span>
                <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FBBF24', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Tier: {selectedUser.subscriptionTier}
                </span>
                <span style={{ backgroundColor: selectedUser.accountStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: selectedUser.accountStatus === 'ACTIVE' ? '#10B981' : '#EF4444', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                  Status: {selectedUser.accountStatus}
                </span>
                {selectedUser.isFlagged && (
                  <span style={{ backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                    Flagged: {selectedUser.flagReason || 'Suspicious Activity'}
                  </span>
                )}
              </div>

              {/* Job Seeker Details */}
              {selectedUser.jobSeekerProfile && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00F0FF', margin: 0 }}>Candidate Profile Data</h3>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Full Name</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.firstName} {selectedUser.jobSeekerProfile.lastName} {selectedUser.jobSeekerProfile.otherNames || ''}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Profession / Role</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.profession || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Desired Job Title</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.desiredJobTitle || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Phone Number</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.phone || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Residence</div>
                      <div style={{ fontWeight: 600 }}>
                        {[selectedUser.jobSeekerProfile.residenceCity, selectedUser.jobSeekerProfile.residenceState, selectedUser.jobSeekerProfile.residenceCountry].filter(Boolean).join(', ') || '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Relocation Willingness</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.willingToRelocate ? 'Yes (Global)' : 'No'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Autonomous Auto-Apply</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.jobSeekerProfile.autoApplyEnabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>

                  {selectedUser.jobSeekerProfile.skills && selectedUser.jobSeekerProfile.skills.length > 0 && (
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>Skills & Competencies</div>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {selectedUser.jobSeekerProfile.skills.map((s, idx) => (
                          <span key={idx} style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser.jobSeekerProfile.bio && (
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>Candidate Bio</div>
                      <p style={{ backgroundColor: 'rgba(255, 255, 255, 0.04)', padding: '0.8rem', borderRadius: '10px', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
                        {selectedUser.jobSeekerProfile.bio}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Employer Details */}
              {selectedUser.employer && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#00F0FF', margin: 0 }}>Employer Corporate Profile</h3>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Company Name</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.employer.companyName}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Industry</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.employer.industry || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Company Size</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.employer.companySize || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Website</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedUser.employer.website ? (
                          <a href={selectedUser.employer.website} target="_blank" rel="noreferrer" style={{ color: '#00F0FF' }}>
                            {selectedUser.employer.website}
                          </a>
                        ) : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>Registration No / RC</div>
                      <div style={{ fontWeight: 600 }}>{selectedUser.employer.registrationNumber || '—'}</div>
                    </div>
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem' }}>HR Contact</div>
                      <div style={{ fontWeight: 600 }}>
                        {selectedUser.employer.hrContactName || '—'} ({selectedUser.employer.hrEmail || selectedUser.employer.hrPhone || 'No contact info'})
                      </div>
                    </div>
                  </div>

                  {selectedUser.employer.jobs && selectedUser.employer.jobs.length > 0 && (
                    <div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: '0.8rem', marginBottom: '0.4rem' }}>
                        Active Job Vacancies Posted ({selectedUser.employer.jobs.length})
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {selectedUser.employer.jobs.map((job) => (
                          <div key={job.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.8rem', backgroundColor: 'rgba(255, 255, 255, 0.04)', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <span style={{ fontWeight: 600 }}>{job.title}</span>
                            <span style={{ color: 'rgba(255, 255, 255, 0.5)' }}>{job.location || 'Remote'} • {job.isRemote ? 'Remote' : 'On-site'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '1.25rem' }}>
                <button
                  onClick={() => {
                    const u = selectedUser;
                    setSelectedUser(null);
                    openEditModal(u);
                  }}
                  style={{
                    backgroundColor: '#6366F1',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Edit User Role / Tier
                </button>
                <button
                  onClick={() => setSelectedUser(null)}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Role / Tier / Status Modal */}
        {editingUser && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.5rem',
              zIndex: 9999,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                backgroundColor: '#120B1C',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '20px',
                maxWidth: '500px',
                width: '100%',
                padding: '2rem',
                position: 'relative',
              }}
            >
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 1rem 0' }}>
                Manage User: <span style={{ color: '#00F0FF' }}>{editingUser.email}</span>
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e: any) => setEditRole(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      outline: 'none',
                    }}
                  >
                    <option value="JOB_SEEKER">JOB_SEEKER (Candidate)</option>
                    <option value="EMPLOYER">EMPLOYER (Recruiter / Company)</option>
                    <option value="ADMIN">ADMIN (System Administrator)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Subscription Tier
                  </label>
                  <select
                    value={editTier}
                    onChange={(e: any) => setEditTier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      outline: 'none',
                    }}
                  >
                    <option value="FREE">FREE (Standard)</option>
                    <option value="SILVER">SILVER Tier</option>
                    <option value="PREMIUM">PREMIUM Tier</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.6)' }}>
                    Account Access Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e: any) => setEditStatus(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.8rem',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      outline: 'none',
                    }}
                  >
                    <option value="ACTIVE">ACTIVE (Authorized)</option>
                    <option value="SUSPENDED">SUSPENDED (Access Blocked)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="flaggedCheck"
                    checked={editFlagged}
                    onChange={(e) => setEditFlagged(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="flaggedCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                    Flag account for security/fraud inspection
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '2rem' }}>
                <button
                  onClick={() => setEditingUser(null)}
                  disabled={isSavingEdit}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUserEdit}
                  disabled={isSavingEdit}
                  style={{
                    backgroundColor: '#6366F1',
                    color: 'white',
                    border: 'none',
                    padding: '0.7rem 1.4rem',
                    borderRadius: '10px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
