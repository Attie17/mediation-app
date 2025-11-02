import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import Sidebar from '../../components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import EditOrganizationModal from '../../components/admin/EditOrganizationModal';
import InviteMediatorModal from '../../components/admin/InviteMediatorModal';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  ArrowLeft,
  Edit,
  Trash2,
  CreditCard,
  Database,
  Calendar,
  Mail,
  Phone,
  Globe,
  MapPin,
  AlertCircle,
  CheckCircle,
  UserPlus
} from 'lucide-react';

export default function OrganizationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const [casesLoading, setCasesLoading] = useState(false);

  const formatStatusLabel = (value, fallback = 'Unknown') => {
    if (typeof value !== 'string') {
      return fallback;
    }
    const cleaned = value.replace(/_/g, ' ').trim();
    if (!cleaned) {
      return fallback;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  useEffect(() => {
    fetchOrganizationDetails();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'users' && users.length === 0) {
      fetchUsers();
    } else if (activeTab === 'cases' && cases.length === 0) {
      fetchCases();
    }
  }, [activeTab]);

  const fetchOrganizationDetails = async () => {
    try {
      setLoading(true);
      
      const [orgData, statsData] = await Promise.all([
        apiFetch(`/api/organizations/${id}`),
        apiFetch(`/api/organizations/${id}/stats`)
      ]);
      
      setOrganization(orgData.organization || null);
      setStats(statsData.stats || null);
      setError(null);
      setError(null);
    } catch (err) {
      console.error('Error fetching organization:', err);
      setError('Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      
      const data = await apiFetch(`/api/organizations/${id}/users`);
      
      const normalizedUsers = (data.users || []).map((user) => ({
        ...user,
        id: user.id ?? user.user_id
      }));
      setUsers(normalizedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchCases = async () => {
    try {
      setCasesLoading(true);
      
      const data = await apiFetch(`/api/organizations/${id}/cases`);
      
      setCases(data.cases || []);
    } catch (err) {
      console.error('Error fetching cases:', err);
    } finally {
      setCasesLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${organization?.display_name}? This cannot be undone.`)) {
      return;
    }

    try {
      await apiFetch(`/api/organizations/${id}`, {
        method: 'DELETE'
      });

      navigate('/admin/organizations');
    } catch (err) {
      console.error('Error deleting organization:', err);
      alert(err.message || 'Unable to delete organization');
    }
  };

  const handleOrganizationUpdated = (updatedOrg) => {
    setOrganization(updatedOrg);
    // Optionally refetch stats
    fetchOrganizationDetails();
  };

  if (loading) {
    return (
      <DashboardFrame title="Organization Details">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-pulse text-slate-400">Loading organization...</div>
          </CardContent>
        </Card>
      </DashboardFrame>
    );
  }

  if (error) {
    return (
      <DashboardFrame title="Organization Details">
        <Card>
          <CardContent className="p-8">
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => navigate('/admin/organizations')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors"
            >
              Back to Organizations
            </button>
          </CardContent>
        </Card>
      </DashboardFrame>
    );
  }

  const resolvedSubscriptionStatus =
    typeof organization?.subscription_status === 'string' && organization.subscription_status.trim()
      ? organization.subscription_status
      : '';
  const subscriptionStatusLabel = formatStatusLabel(resolvedSubscriptionStatus, 'Unknown');
  const subscriptionStatusClass = resolvedSubscriptionStatus === 'active'
    ? 'bg-green-500/20 text-green-300 border-green-500/30'
    : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30';
  const subscriptionTierLabel = formatStatusLabel(organization?.subscription_tier, 'Unknown');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={user} onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
      <DashboardFrame title={organization?.display_name || organization?.name || "Organization Details"}>
        <div className="space-y-6">
        {/* Header - Back Button at Top */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/admin/organizations')}
            className="
              inline-flex items-center gap-2 px-4 py-2 rounded-lg
              bg-slate-800/50 border border-slate-700
              text-slate-300 hover:text-teal-400
              hover:border-teal-500/50
              transition-all duration-200
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Organizations
          </button>
        </div>

        {/* Organization Info */}
        <div>
          <button
            onClick={() => navigate('/')}
            className="
              inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-slate-800/30 border border-slate-700/50
              text-slate-400 hover:text-teal-400
              hover:border-teal-500/50
              transition-all duration-200 mb-4 text-sm
            "
          >
            <ArrowLeft className="w-3 h-3" />
            Dashboard
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-slate-100 mb-1">
                  {organization?.display_name || organization?.name}
                </h1>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${subscriptionStatusClass}`}>
                    {subscriptionStatusLabel}
                  </span>
                  <span className="px-2 py-1 rounded-md text-xs font-medium border bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {subscriptionTierLabel} Plan
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditModal(true)}
                className="
                  px-4 py-2 rounded-lg
                  bg-teal-500/20 hover:bg-teal-500/30
                  border border-teal-500/30 hover:border-teal-500/50
                  text-teal-300 font-medium
                  transition-all
                  flex items-center gap-2
                "
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="
                  px-4 py-2 rounded-lg
                  bg-red-500/20 hover:bg-red-500/30
                  border border-red-500/30 hover:border-red-500/50
                  text-red-300 font-medium
                  transition-all
                  flex items-center gap-2
                "
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-400" />
                  <div>
                    <div className="text-2xl font-bold text-slate-100">{stats?.total_users ?? 0}</div>
                    <div className="text-sm text-slate-400">Total Users</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-teal-400" />
                  <div>
                    <div className="text-2xl font-bold text-slate-100">{stats?.active_cases ?? 0}</div>
                    <div className="text-sm text-slate-400">Active Cases</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <div className="text-2xl font-bold text-slate-100">{stats?.resolved_cases ?? 0}</div>
                    <div className="text-sm text-slate-400">Resolved</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-purple-400" />
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {stats?.storage_used_mb ?? 0} MB
                    </div>
                    <div className="text-sm text-slate-400">
                      of {organization?.storage_limit_mb} MB
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex gap-2 border-b border-slate-700">
            {['overview', 'users', 'cases', 'billing'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  px-4 py-2 font-medium transition-all
                  ${activeTab === tab
                    ? 'text-teal-400 border-b-2 border-teal-400'
                    : 'text-slate-400 hover:text-slate-300'
                  }
                `}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Organization Details */}
              <Card gradient>
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {organization?.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{organization.email}</span>
                      </div>
                    )}
                    {organization?.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-300">{organization.phone}</span>
                      </div>
                    )}
                    {organization?.website && (
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-slate-400" />
                        <a href={organization.website} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                          {organization.website}
                        </a>
                      </div>
                    )}
                    {organization?.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                        <span className="text-slate-300">{organization.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-slate-300">
                        Created {new Date(organization?.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Limits */}
              <Card gradient>
                <CardHeader>
                  <CardTitle>Subscription Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <LimitBar 
                      label="Active Cases"
                      current={stats?.active_cases ?? 0}
                      max={organization?.max_active_cases}
                    />
                    <LimitBar 
                      label="Mediators"
                      current={stats?.mediators ?? 0}
                      max={organization?.max_mediators}
                    />
                    <LimitBar 
                      label="Storage"
                      current={stats?.storage_used_mb ?? 0}
                      max={organization?.storage_limit_mb}
                      unit="MB"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader className="border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-400" />
                    Organization Users
                  </CardTitle>
                  <button 
                    onClick={() => setShowInviteModal(true)}
                    className="px-4 py-2 bg-teal-500/20 hover:bg-teal-500/30 border border-teal-500/30 rounded-lg text-teal-300 text-sm font-medium transition-all flex items-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite User
                  </button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {usersLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No users in this organization yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Name</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Email</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Role</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Joined</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((user) => (
                          <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-medium text-slate-200">{user.name || 'N/A'}</div>
                            </td>
                            <td className="py-3 px-4 text-slate-300">{user.email}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                                user.role === 'mediator' ? 'bg-blue-500/20 text-blue-300' :
                                user.role === 'lawyer' ? 'bg-amber-500/20 text-amber-300' :
                                'bg-slate-500/20 text-slate-300'
                              }`}>
                                {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-500/20 text-green-300' :
                                'bg-yellow-500/20 text-yellow-300'
                              }`}>
                                {user.status || 'active'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-sm">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'cases' && (
            <Card>
              <CardHeader className="border-b border-slate-700">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-teal-400" />
                  Organization Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {casesLoading ? (
                  <div className="text-center py-8 text-slate-400">Loading cases...</div>
                ) : cases.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">No cases in this organization yet</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Case Title</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Status</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Participants</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Created</th>
                          <th className="text-left py-3 px-4 text-sm font-semibold text-slate-300">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cases.map((caseItem) => {
                          const caseStatus =
                            typeof caseItem.status === 'string' && caseItem.status.trim()
                              ? caseItem.status
                              : '';
                          const statusLabel = formatStatusLabel(caseStatus, 'Unknown');
                          const statusClass = caseStatus === 'open'
                            ? 'bg-green-500/20 text-green-300'
                            : caseStatus === 'in_progress'
                              ? 'bg-blue-500/20 text-blue-300'
                              : caseStatus === 'closed'
                                ? 'bg-slate-500/20 text-slate-300'
                                : 'bg-yellow-500/20 text-yellow-300';

                          return (
                            <tr key={caseItem.id} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                              <td className="py-3 px-4">
                                <div className="font-medium text-slate-200">{caseItem.title || 'Untitled Case'}</div>
                              </td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-md text-xs font-medium ${statusClass}`}>
                                  {statusLabel}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-slate-300">
                                {caseItem.participant_count || 0} participants
                              </td>
                              <td className="py-3 px-4 text-slate-400 text-sm">
                                {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  onClick={() => navigate(`/cases/${caseItem.id}`)}
                                  className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
                                >
                                  View Details
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Subscription Overview */}
              <Card>
                <CardHeader className="border-b border-slate-700">
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-teal-400" />
                    Subscription Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Current Plan</div>
                      <div className="text-xl font-bold text-slate-100">
                        {organization?.subscription_tier?.charAt(0).toUpperCase() + 
                         organization?.subscription_tier?.slice(1)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Status</div>
                      <div>
                        <span className={`px-3 py-1 rounded-md text-sm font-medium border ${subscriptionStatusClass}`}>
                          {subscriptionStatusLabel}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400 mb-1">Billing Period</div>
                      <div className="text-lg font-semibold text-slate-200">
                        {organization?.subscription_start_date && organization?.subscription_end_date ? (
                          <>
                            {new Date(organization.subscription_start_date).toLocaleDateString()} - 
                            {new Date(organization.subscription_end_date).toLocaleDateString()}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader className="border-b border-slate-700">
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center py-8 text-slate-400">
                    <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Payment history will be available once invoicing is implemented</p>
                    <p className="text-sm mt-2">This feature is coming soon</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Edit Organization Modal */}
        <EditOrganizationModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          organization={organization}
          onOrganizationUpdated={handleOrganizationUpdated}
        />

        {/* Invite User Modal */}
        <InviteMediatorModal
          isOpen={showInviteModal}
          onClose={() => setShowInviteModal(false)}
          organizationId={id}
          organizationName={organization?.display_name || organization?.name}
          onInviteSent={() => {
            // Refresh users list
            if (activeTab === 'users') {
              fetchUsers();
            }
          }}
        />
      </div>
    </DashboardFrame>
        </div>
      </div>
    </div>
  );
}

function LimitBar({ label, current, max, unit = '' }) {
  const percentage = max ? Math.min((current / max) * 100, 100) : 0;
  const isUnlimited = max === null || max === undefined;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-2">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">
          {current}{unit} {!isUnlimited && `/ ${max}${unit}`}
        </span>
      </div>
      {!isUnlimited && (
        <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all ${
              percentage >= 90 ? 'bg-red-500' :
              percentage >= 70 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
      {isUnlimited && (
        <div className="text-sm text-teal-400">Unlimited</div>
      )}
    </div>
  );
}
