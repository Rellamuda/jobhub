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
  };
  employer?: {
    id?: string;
    companyName?: string;
    description?: string;
    industry?: string;
    companySize?: string;
    website?: string;
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

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<any>(null);
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
      const [usersRes, statsRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
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
    } catch (e: any) {
      console.error(e);
      setMessage({ type: 'error', text: 'Error connecting to admin service: ' + e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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
        showNotification('error', 'Failed to delete user');
      }
    } catch (e: any) {
      showNotification('error', e.message);
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

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0A0A0A', color: 'white', padding: '2rem 1.5rem' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>🛡️</span>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }}>
                JobHub AI <span style={{ background: 'linear-gradient(90deg, #6366F1, #00F0FF)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Admin Control Center</span>
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
              🔄 Refresh Data
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
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
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
                🔑 Log In as Administrator
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
                🔄 Refresh Session
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'rgba(255, 255, 255, 0.6)' }}>
            <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
            <div>Loading JobHub AI platform intelligence and user database...</div>
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
              <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>⏳</div>
              <div>Loading users database...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: 'rgba(255, 255, 255, 0.5)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
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
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isSeeker ? '#4338CA' : isEmployer ? '#0891B2' : '#B45309',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.9rem',
                                flexShrink: 0,
                              }}
                            >
                              {(fullName || user.email)[0].toUpperCase()}
                            </div>
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
                              ● {user.accountStatus}
                            </span>
                            {user.isFlagged && (
                              <span style={{ fontSize: '0.7rem', color: '#EF4444', fontWeight: 600 }}>🚩 Flagged</span>
                            )}
                          </div>
                        </td>

                        {/* Location / Contact */}
                        <td style={{ padding: '1rem', color: 'rgba(255, 255, 255, 0.7)' }}>
                          <div>📍 {location}</div>
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.4)', marginTop: '0.15rem' }}>📞 {phone}</div>
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

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div
                  style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '50%',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.3rem',
                  }}
                >
                  {selectedUser.email[0].toUpperCase()}
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
