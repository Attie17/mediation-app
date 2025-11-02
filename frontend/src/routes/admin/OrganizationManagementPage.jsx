import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardFrame from '../../components/DashboardFrame';
import Sidebar from '../../components/Sidebar';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import NewOrganizationModal from '../../components/admin/NewOrganizationModal';
import EditOrganizationModal from '../../components/admin/EditOrganizationModal';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { 
  Building2, 
  Users, 
  FileText, 
  TrendingUp,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Crown,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';

export default function OrganizationManagementPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterTier, setFilterTier] = useState('all');
  const [showNewOrgModal, setShowNewOrgModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, [filterStatus, filterTier]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterTier !== 'all') params.append('tier', filterTier);
      if (searchQuery) params.append('search', searchQuery);
      
      const url = `/api/organizations${params.toString() ? '?' + params.toString() : ''}`;
      
      const data = await apiFetch(url);
      
      setOrganizations(data.organizations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrganizations();
  };

  const handleOrganizationCreated = (newOrg) => {
    // Refresh the list
    fetchOrganizations();
  };

  const handleOrganizationUpdated = (updatedOrg) => {
    // Refresh the list
    fetchOrganizations();
    setShowEditModal(false);
    setSelectedOrganization(null);
  };

  const formatStatusLabel = (value, fallback = 'Active') => {
    if (typeof value !== 'string') {
      return fallback;
    }
    const cleaned = value.replace(/_/g, ' ').trim();
    if (!cleaned) {
      return fallback;
    }
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  const getTierBadge = (tier) => {
    const resolvedTier = typeof tier === 'string' && tier.trim() ? tier : 'trial';
    const colors = {
      trial: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      basic: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      pro: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      enterprise: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium border ${colors[resolvedTier] || colors.trial}`}>
        {resolvedTier === 'enterprise' && <Crown className="w-3 h-3" />}
        {resolvedTier.charAt(0).toUpperCase() + resolvedTier.slice(1)}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const resolvedStatus = typeof status === 'string' && status.trim() ? status : 'active';
    const colors = {
      active: 'bg-green-500/20 text-green-300 border-green-500/30',
      trialing: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      past_due: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      canceled: 'bg-red-500/20 text-red-300 border-red-500/30',
      suspended: 'bg-red-500/20 text-red-300 border-red-500/30'
    };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium border ${colors[resolvedStatus] || colors.active}`}>
        {formatStatusLabel(resolvedStatus)}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={user} onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
      <DashboardFrame title="Organizations">
        <div className="space-y-6">
          {/* Back Button */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/')}
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-slate-400">
                Manage mediation practices and their subscriptions
              </p>
            </div>
            <button
              onClick={() => setShowNewOrgModal(true)}
              className="
                px-4 py-2 rounded-lg
                bg-gradient-to-r from-teal-500 to-emerald-500
                hover:from-teal-600 hover:to-emerald-600
                text-white font-medium
                flex items-center gap-2
                transition-all shadow-lg shadow-teal-500/20
              "
            >
              <Plus className="w-4 h-4" />
              New Organization
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="max-w-7xl mx-auto mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="
                        w-full pl-10 pr-4 py-2 rounded-lg
                        bg-slate-800/50 border border-slate-700
                        text-slate-200 placeholder-slate-500
                        focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                      "
                    />
                  </div>
                </form>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="
                    px-4 py-2 rounded-lg
                    bg-slate-800/50 border border-slate-700
                    text-slate-200
                    focus:outline-none focus:border-teal-500/50
                  "
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                </select>

                {/* Tier Filter */}
                <select
                  value={filterTier}
                  onChange={(e) => setFilterTier(e.target.value)}
                  className="
                    px-4 py-2 rounded-lg
                    bg-slate-800/50 border border-slate-700
                    text-slate-200
                    focus:outline-none focus:border-teal-500/50
                  "
                >
                  <option value="all">All Tiers</option>
                  <option value="trial">Trial</option>
                  <option value="basic">Basic</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organizations List */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse text-slate-400">Loading organizations...</div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center gap-3 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          ) : organizations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No organizations found</h3>
                <p className="text-slate-500 mb-6">
                  {searchQuery || filterStatus !== 'all' || filterTier !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first organization'}
                </p>
                <button
                  onClick={() => navigate('/admin/organizations/new')}
                  className="
                    px-6 py-3 rounded-lg
                    bg-gradient-to-r from-teal-500 to-emerald-500
                    hover:from-teal-600 hover:to-emerald-600
                    text-white font-medium
                    inline-flex items-center gap-2
                    transition-all
                  "
                >
                  <Plus className="w-4 h-4" />
                  Create Organization
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {organizations.map((org) => (
                <Card key={org.id} gradient hover>
                  <CardDecoration color="teal" />
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-slate-100 mb-1">
                            {org.display_name || org.name}
                          </h3>
                          <div className="flex items-center gap-2">
                            {getTierBadge(org.subscription_tier)}
                            {getStatusBadge(org.subscription_status)}
                          </div>
                        </div>
                      </div>
                      <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-1 font-medium">
                          <Users className="w-3 h-3" />
                          Users
                        </div>
                        <div className="text-xl font-bold text-slate-100">
                          {org.user_count || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-1 font-medium">
                          <FileText className="w-3 h-3" />
                          Cases
                        </div>
                        <div className="text-xl font-bold text-slate-100">
                          {org.case_count || 0}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-slate-300 text-xs mb-1 font-medium">
                          <TrendingUp className="w-3 h-3" />
                          Storage
                        </div>
                        <div className="text-sm font-bold text-slate-100">
                          {org.storage_used_mb || 0} MB
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/admin/organizations/${org.id}`)}
                        className="
                          flex-1 px-4 py-2 rounded-lg
                          bg-slate-700/50 hover:bg-slate-700
                          border border-slate-600/50 hover:border-slate-500
                          text-slate-200 text-sm font-medium
                          transition-all
                          flex items-center justify-center gap-2
                        "
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button
                        onClick={() => {
                          setSelectedOrganization(org);
                          setShowEditModal(true);
                        }}
                        className="
                          px-4 py-2 rounded-lg
                          bg-teal-500/20 hover:bg-teal-500/30
                          border border-teal-500/30 hover:border-teal-500/50
                          text-teal-300 text-sm font-medium
                          transition-all
                          flex items-center justify-center gap-2
                        "
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* New Organization Modal */}
        {/* New Organization Modal */}
        <NewOrganizationModal
          isOpen={showNewOrgModal}
          onClose={() => setShowNewOrgModal(false)}
          onOrganizationCreated={handleOrganizationCreated}
        />

        {/* Edit Organization Modal */}
        <EditOrganizationModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrganization(null);
          }}
          organization={selectedOrganization}
          onOrganizationUpdated={handleOrganizationUpdated}
        />
        </div>
      </DashboardFrame>
        </div>
      </div>
    </div>
  );
}
