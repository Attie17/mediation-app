import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { FileText, Search, Filter, Plus, Users, Calendar, AlertCircle, ArrowLeft } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card-enhanced';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';
import { CaseCardSkeleton } from '../../components/ui/skeleton';
import CreateCaseModal from '../../components/modals/CreateCaseModal';
import { useCasePolling } from '../../hooks/usePolling';

export default function MediatorCasesList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchCases = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      // Use new caseslist endpoint with mediator filtering
      const params = {
        role: 'mediator',
        mediatorId: user.user_id,
        limit: 100
      };
      
      const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.listAll(params)}`, {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      } else {
        console.error('Failed to fetch cases:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up polling for cases (every 45 seconds)
  useCasePolling(fetchCases, null, 45000);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.case_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    const colors = {
      active: 'bg-lime-500/20 text-lime-300 border-lime-500/30',
      pending: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      completed: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      cancelled: 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return colors[status] || colors.pending;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back Button */}
        <div>
          <button
            onClick={() => navigate('/mediator')}
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Cases</h1>
            <p className="text-slate-400">Manage and track all your mediation cases</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="
              inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
              bg-gradient-to-r from-teal-500 to-blue-500
              hover:from-teal-600 hover:to-blue-600
              text-white font-medium shadow-lg
              hover:shadow-teal-500/25
              transition-all duration-200
            "
          >
            <Plus className="w-4 h-4" />
            Create Case
          </button>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by case number or title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CaseCardSkeleton />
            <CaseCardSkeleton />
            <CaseCardSkeleton />
            <CaseCardSkeleton />
            <CaseCardSkeleton />
            <CaseCardSkeleton />
          </div>
        ) : filteredCases.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No cases found</h3>
              <p className="text-slate-400 mb-6">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'You don\'t have any cases yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCases.map((caseItem) => (
              <Card 
                key={caseItem.id}
                className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all cursor-pointer group"
                onClick={() => navigate(`/case/${caseItem.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-400" />
                      <span className="text-sm font-mono text-slate-400">
                        {caseItem.case_number || 'N/A'}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(caseItem.status)}`}>
                      {caseItem.status || 'pending'}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-400 transition-colors">
                    {caseItem.title || 'Untitled Case'}
                  </h3>
                  
                  {caseItem.description && (
                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                      {caseItem.description}
                    </p>
                  )}
                  
                  <div className="space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {formatDate(caseItem.created_at)}</span>
                    </div>
                    {caseItem.participant_count > 0 && (
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{caseItem.participant_count} participants</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{cases.length}</div>
                <div className="text-sm text-slate-400">Total Cases</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-lime-400">
                  {cases.filter(c => c.status === 'active').length}
                </div>
                <div className="text-sm text-slate-400">Active</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {cases.filter(c => c.status === 'pending').length}
                </div>
                <div className="text-sm text-slate-400">Pending</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-400">
                  {cases.filter(c => c.status === 'completed').length}
                </div>
                <div className="text-sm text-slate-400">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Case Modal */}
      <CreateCaseModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={(newCase) => {
          // Refresh cases list
          fetchCases();
          setShowCreateModal(false);
        }}
      />
    </div>
  );
}
