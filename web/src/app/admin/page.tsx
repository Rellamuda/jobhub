'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AnimatedCard } from '@/components/AnimatedCard';

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await fetch(`/api/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      fetchUsers();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading admin data...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Admin Control Panel</h1>
        <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold">
          Total Users: {users.length}
        </div>
      </div>

      <AnimatedCard className="overflow-hidden">
        <CardContent className="p-0">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
              <tr>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Tier</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td className="p-4 text-sm font-medium">{user.email}</td>
                  <td className="p-4 text-sm">
                    <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold">{user.role}</span>
                  </td>
                  <td className="p-4 text-sm font-semibold">{user.subscriptionTier}</td>
                  <td className="p-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user.accountStatus === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.accountStatus}
                    </span>
                  </td>
                  <td className="p-4 flex gap-2">
                    {user.accountStatus === 'ACTIVE' ? (
                      <Button size="sm" variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => updateStatus(user.id, 'SUSPENDED')}>
                        Suspend
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline" className="text-green-500 border-green-200 hover:bg-green-50" onClick={() => updateStatus(user.id, 'ACTIVE')}>
                        Activate
                      </Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={() => deleteUser(user.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </AnimatedCard>
    </div>
  );
}
