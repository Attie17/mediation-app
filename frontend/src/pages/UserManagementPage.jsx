import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DashboardFrame from '../components/DashboardFrame';
import config from '../config';
import { 
  Users, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  UserPlus,
  Mail,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

const API_BASE_URL = config.api.baseUrl;

const UserManagementPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editingUser, setEditingUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(u => 
        u.email?.toLowerCase().includes(search) ||
        u.name?.toLowerCase().includes(search)
      );
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      // Update local state
      setUsers(users.map(u => 
        u.user_id === userId ? { ...u, role: newRole } : u
      ));

      showSuccess(`Role updated to ${newRole}`);
    } catch (err) {
      console.error('Error updating role:', err);
      setError(err.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      // Remove from local state
      setUsers(users.filter(u => u.user_id !== userId));
      showSuccess('User deleted successfully');
    } catch (err) {
      console.error('Error deleting user:', err);
      setError(err.message);
    }
  };

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      mediator: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      lawyer: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      divorcee: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    };
    return colors[role] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <DashboardFrame title="User Management">
        <div className="flex items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardFrame>
    );
  }

  return (
    <DashboardFrame title="User Management">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate('/admin')}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg
            bg-slate-800/50 border border-slate-700
            text-slate-300 hover:text-teal-400
            hover:border-teal-500/50
            transition-all duration-200
          "
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100 mb-2 flex items-center gap-3">
          <Users className="w-8 h-8 text-teal-400" />
          User Management
        </h1>
        <p className="text-slate-400">
          Manage user accounts, roles, and permissions
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-lg text-green-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Users" value={users.length} icon={<Users />} color="teal" />
        <StatCard label="Divorcees" value={users.filter(u => u.role === 'divorcee').length} icon={<Users />} color="blue" />
        <StatCard label="Mediators" value={users.filter(u => u.role === 'mediator').length} icon={<Shield />} color="teal" />
        <StatCard label="Admins" value={users.filter(u => u.role === 'admin').length} icon={<Shield />} color="purple" />
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-200 placeholder-slate-400 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-slate-400" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-200 focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="all">All Roles</option>
            <option value="divorcee">Divorcee</option>
            <option value="mediator">Mediator</option>
            <option value="lawyer">Lawyer</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50 border-b border-slate-600/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <Users className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No users found</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.user_id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-200">
                            {user.name || 'Unnamed User'}
                          </div>
                          {user.user_id === currentUser?.user_id && (
                            <span className="text-xs text-teal-400">(You)</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={user.role || 'divorcee'}
                        onChange={(e) => handleRoleChange(user.user_id, e.target.value)}
                        disabled={user.user_id === currentUser?.user_id}
                        className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          getRoleBadgeColor(user.role)
                        } ${
                          user.user_id === currentUser?.user_id 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'cursor-pointer hover:opacity-80'
                        }`}
                      >
                        <option value="divorcee">Divorcee</option>
                        <option value="mediator">Mediator</option>
                        <option value="lawyer">Lawyer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Clock className="w-4 h-4" />
                        {formatDate(user.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDeleteUser(user.user_id)}
                          disabled={user.user_id === currentUser?.user_id}
                          className={`p-2 rounded-lg transition-colors ${
                            user.user_id === currentUser?.user_id
                              ? 'opacity-30 cursor-not-allowed'
                              : 'hover:bg-red-500/20 text-slate-400 hover:text-red-400'
                          }`}
                          title={user.user_id === currentUser?.user_id ? "Cannot delete yourself" : "Delete user"}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 text-center text-sm text-slate-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>
    </DashboardFrame>
  );
};

// Helper component for stat cards
function StatCard({ label, value, icon, color }) {
  const colors = {
    teal: 'from-teal-500/20 to-teal-500/5 border-teal-500/30',
    blue: 'from-blue-500/20 to-blue-500/5 border-blue-500/30',
    purple: 'from-purple-500/20 to-purple-500/5 border-purple-500/30'
  };

  return (
    <div className={`p-4 rounded-lg bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-slate-400">{React.cloneElement(icon, { className: 'w-5 h-5' })}</div>
        <div className="text-2xl font-bold text-slate-100">{value}</div>
      </div>
      <div className="text-sm text-slate-400">{label}</div>
    </div>
  );
}

export default UserManagementPage;
