import React from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

const ROLES = ['admin', 'mediator', 'lawyer', 'divorcee'];

export default function AdminWorkspace() {
  const { user } = useAuth();
  const [users, setUsers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiFetch('/api/users');
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeRole = async (id, role) => {
    try {
      setError('');
      const { user: updated } = await apiFetch(`/api/users/${id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role }),
      });
      setUsers(prev => prev.map(u => (u.id === updated.id ? { ...u, role: updated.role } : u)));
    } catch (e) {
      setError(e.message || 'Failed to update role');
    }
  };

  const hasAdminUI = user?.role === 'admin';
  const token = localStorage.getItem('auth_token') || '';
  const hasRealToken = token && token !== 'fake-jwt-token' && token.includes('.');

  return (
    <div className="w-full h-full flex flex-col items-center justify-start p-6 sm:p-8 md:p-12 text-white">
      <div className="w-full max-w-4xl">
        <h3 className="text-2xl font-bold mb-4">Admin: User Roles</h3>
        {!hasRealToken && (
          <div className="mb-4 rounded-md bg-yellow-400/20 text-yellow-100 border border-yellow-300/40 p-3">
            <p className="text-sm">
              A valid admin JWT is required. Use your Supabase admin token and store it in localStorage as 'token', or run the provided PowerShell script <code>get-jwt.ps1</code> and paste the token.
            </p>
          </div>
        )}
        {!hasAdminUI && (
          <div className="mb-4 rounded-md bg-blue-300/20 text-blue-100 border border-blue-200/40 p-3">
            <p className="text-sm">Your current UI role is not admin. The backend still enforces admin-only changes.</p>
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-md bg-red-500/20 text-red-100 border border-red-400/40 p-3">
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div className="bg-blue-700/60 rounded-xl shadow overflow-hidden">
          <div className="p-3 text-sm opacity-90">{loading ? 'Loading users…' : `${users.length} users`}</div>
          <table className="w-full text-left">
            <thead className="bg-blue-700/80">
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="odd:bg-blue-700/40 even:bg-blue-700/20">
                  <td className="px-4 py-2">{u.email || '—'}</td>
                  <td className="px-4 py-2">{u.name || '—'}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role || 'divorcee'}
                      onChange={(e) => onChangeRole(u.id, e.target.value)}
                      className="rounded-md bg-white/90 text-blue-800 px-3 py-1"
                    >
                      {ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
