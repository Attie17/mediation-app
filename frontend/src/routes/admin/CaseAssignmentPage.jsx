import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent, CardDecoration } from '../../components/ui/card-enhanced';
import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/apiClient';
import { 
  Briefcase,
  Users, 
  FileText, 
  AlertCircle,
  CheckCircle,
  UserCheck,
  UserX,
  Search,
  Filter,
  TrendingUp,
  Clock,
  ArrowRight,
  RefreshCw,
  ArrowLeft
} from 'lucide-react';

export default function CaseAssignmentPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [unassignedCases, setUnassignedCases] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [mediatorWorkload, setMediatorWorkload] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('unassigned');
  const [selectedCase, setSelectedCase] = useState(null);
  const [selectedMediator, setSelectedMediator] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [unassignedData, assignmentsData, workloadData] = await Promise.all([
        apiFetch('/api/case-assignments/unassigned'),
        apiFetch('/api/case-assignments'),
        apiFetch('/api/case-assignments/mediator-workload')
      ]);

      setUnassignedCases(unassignedData);
      setAssignments(assignmentsData);
      setMediatorWorkload(workloadData);
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCase = async () => {
    if (!selectedCase || !selectedMediator) {
      alert('Please select a case and mediator');
      return;
    }

    try {
      setIsAssigning(true);
      
      const data = await apiFetch('/api/case-assignments', {
        method: 'POST',
        body: JSON.stringify({
          case_id: selectedCase,
          mediator_id: selectedMediator,
          notes: assignmentNotes
        })
      });

      alert('Case assigned successfully!');
      setSelectedCase(null);
      setSelectedMediator('');
      setAssignmentNotes('');
      fetchData(); // Refresh data
    } catch (err) {
      console.error('Error assigning case:', err);
      alert(err.message || 'Unable to assign case');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReassign = async (assignmentId, newMediatorId) => {
    try {
      await apiFetch(`/api/case-assignments/${assignmentId}/reassign`, {
        method: 'PUT',
        body: JSON.stringify({
          new_mediator_id: newMediatorId
        })
      });

      alert('Case reassigned successfully!');
      fetchData();
    } catch (err) {
      console.error('Error reassigning case:', err);
      alert(err.message || 'Unable to reassign case');
    }
  };

  const handleUnassign = async (assignmentId) => {
    if (!confirm('Are you sure you want to unassign this case?')) {
      return;
    }

    try {
      await apiFetch(`/api/case-assignments/${assignmentId}`, {
        method: 'DELETE'
      });

      alert('Case unassigned successfully!');
      fetchData();
    } catch (err) {
      console.error('Error unassigning case:', err);
      alert(err.message || 'Unable to unassign case');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      'in_progress': 'text-blue-400 bg-blue-500/20 border-blue-500/30',
      'resolved': 'text-green-400 bg-green-500/20 border-green-500/30',
      'closed': 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    };
    return colors[status] || colors.pending;
  };

  const getWorkloadColor = (caseCount) => {
    if (caseCount === 0) return 'text-slate-400';
    if (caseCount <= 3) return 'text-green-400';
    if (caseCount <= 7) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <Sidebar user={user} onLogout={logout} />
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Back Button */}
          <div className="max-w-7xl mx-auto mb-4">
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
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 mb-1">
              Case Assignments
            </h1>
            <p className="text-slate-400">
              Manage mediator assignments and workload distribution
            </p>
          </div>
          <button
            onClick={fetchData}
            className="
              px-4 py-2 rounded-lg
              bg-slate-700/50 hover:bg-slate-700
              border border-slate-600/50 hover:border-slate-500
              text-slate-200 font-medium
              flex items-center gap-2
              transition-all
            "
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-7xl mx-auto mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <UserX className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {unassignedCases.length}
                    </div>
                    <div className="text-sm text-slate-400">Unassigned Cases</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {assignments.filter(a => a.status === 'active').length}
                    </div>
                    <div className="text-sm text-slate-400">Active Assignments</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card gradient>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-teal-500/20 flex items-center justify-center">
                    <Users className="w-6 h-6 text-teal-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-slate-100">
                      {mediatorWorkload.length}
                    </div>
                    <div className="text-sm text-slate-400">Active Mediators</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setActiveTab('unassigned')}
              className={`
                px-4 py-2 font-medium transition-all
                ${activeTab === 'unassigned'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              Unassigned Cases ({unassignedCases.length})
            </button>
            <button
              onClick={() => setActiveTab('workload')}
              className={`
                px-4 py-2 font-medium transition-all
                ${activeTab === 'workload'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              Mediator Workload
            </button>
            <button
              onClick={() => setActiveTab('assignments')}
              className={`
                px-4 py-2 font-medium transition-all
                ${activeTab === 'assignments'
                  ? 'text-teal-400 border-b-2 border-teal-400'
                  : 'text-slate-400 hover:text-slate-300'
                }
              `}
            >
              All Assignments ({assignments.length})
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-pulse text-slate-400">Loading...</div>
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
          ) : (
            <>
              {/* Unassigned Cases Tab */}
              {activeTab === 'unassigned' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Case List */}
                  <div className="lg:col-span-2 space-y-4">
                    {unassignedCases.length === 0 ? (
                      <Card>
                        <CardContent className="p-12 text-center">
                          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-slate-300 mb-2">
                            All Cases Assigned!
                          </h3>
                          <p className="text-slate-500">
                            There are no unassigned cases at the moment.
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      unassignedCases.map((caseItem) => (
                        <Card 
                          key={caseItem.id} 
                          gradient 
                          hover
                          className={selectedCase === caseItem.id ? 'ring-2 ring-teal-500' : ''}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <FileText className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-500">
                                    Case ID: {caseItem.id.substring(0, 8)}...
                                  </span>
                                </div>
                                <div className="mb-2">
                                  <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(caseItem.status)}`}>
                                    {caseItem.status?.replace('_', ' ')}
                                  </span>
                                </div>
                                {caseItem.created_at && (
                                  <div className="flex items-center gap-2 text-sm text-slate-400">
                                    <Clock className="w-3 h-3" />
                                    Created {new Date(caseItem.created_at).toLocaleDateString()}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedCase(caseItem.id)}
                                className={`
                                  px-4 py-2 rounded-lg font-medium transition-all
                                  ${selectedCase === caseItem.id
                                    ? 'bg-teal-500 text-white'
                                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-200'
                                  }
                                `}
                              >
                                {selectedCase === caseItem.id ? 'Selected' : 'Select'}
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>

                  {/* Assignment Panel */}
                  <div>
                    <Card gradient className="sticky top-6">
                      <CardHeader>
                        <CardTitle>Assign Mediator</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {!selectedCase ? (
                          <div className="text-center py-8 text-slate-400">
                            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Select a case to assign</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Select Mediator
                              </label>
                              <select
                                value={selectedMediator}
                                onChange={(e) => setSelectedMediator(e.target.value)}
                                className="
                                  w-full px-4 py-2 rounded-lg
                                  bg-slate-800/50 border border-slate-700
                                  text-slate-200
                                  focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                                "
                              >
                                <option value="">Choose mediator...</option>
                                {mediatorWorkload.map((mediator) => (
                                  <option key={mediator.mediator_id} value={mediator.mediator_id}>
                                    {mediator.mediator_name || mediator.mediator_email} ({mediator.case_count} cases)
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">
                                Notes (optional)
                              </label>
                              <textarea
                                value={assignmentNotes}
                                onChange={(e) => setAssignmentNotes(e.target.value)}
                                rows={3}
                                placeholder="Add any assignment notes..."
                                className="
                                  w-full px-4 py-2 rounded-lg
                                  bg-slate-800/50 border border-slate-700
                                  text-slate-200 placeholder-slate-500
                                  focus:outline-none focus:border-teal-500/50 focus:ring-2 focus:ring-teal-500/20
                                "
                              />
                            </div>

                            <button
                              onClick={handleAssignCase}
                              disabled={!selectedMediator || isAssigning}
                              className="
                                w-full px-4 py-3 rounded-lg
                                bg-gradient-to-r from-teal-500 to-emerald-500
                                hover:from-teal-600 hover:to-emerald-600
                                disabled:from-slate-700 disabled:to-slate-700
                                text-white font-medium
                                flex items-center justify-center gap-2
                                transition-all
                                disabled:cursor-not-allowed
                              "
                            >
                              {isAssigning ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  Assigning...
                                </>
                              ) : (
                                <>
                                  <ArrowRight className="w-4 h-4" />
                                  Assign Case
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Mediator Workload Tab */}
              {activeTab === 'workload' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mediatorWorkload.length === 0 ? (
                    <Card className="col-span-full">
                      <CardContent className="p-12 text-center">
                        <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300 mb-2">
                          No Mediators Found
                        </h3>
                        <p className="text-slate-500">
                          Invite mediators to start assigning cases.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    mediatorWorkload.map((mediator) => (
                      <Card key={mediator.mediator_id} gradient hover>
                        <CardDecoration color="teal" />
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center">
                              <Users className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-100 mb-1">
                                {mediator.mediator_name || 'Unnamed Mediator'}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {mediator.mediator_email}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div>
                              <div className={`text-3xl font-bold ${getWorkloadColor(mediator.case_count)}`}>
                                {mediator.case_count}
                              </div>
                              <div className="text-sm text-slate-400">Active Cases</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-400 mb-1">Capacity</div>
                              <div className={`text-lg font-semibold ${
                                mediator.case_count === 0 ? 'text-green-400' :
                                mediator.case_count <= 3 ? 'text-green-400' :
                                mediator.case_count <= 7 ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {mediator.case_count === 0 ? 'Available' :
                                 mediator.case_count <= 3 ? 'Good' :
                                 mediator.case_count <= 7 ? 'Busy' :
                                 'Overloaded'}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}

              {/* All Assignments Tab */}
              {activeTab === 'assignments' && (
                <div className="space-y-4">
                  {assignments.length === 0 ? (
                    <Card>
                      <CardContent className="p-12 text-center">
                        <Briefcase className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-300 mb-2">
                          No Assignments Yet
                        </h3>
                        <p className="text-slate-500">
                          Start assigning cases to mediators.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    assignments.map((assignment) => (
                      <Card key={assignment.id} gradient hover>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                                <FileText className="w-5 h-5 text-teal-400" />
                              </div>
                              <div>
                                <div className="text-sm text-slate-500 mb-1">
                                  Case: {assignment.case_id?.substring(0, 8)}...
                                </div>
                                <div className="font-medium text-slate-200">
                                  Assigned to: {assignment.mediator_name || assignment.mediator_email || 'Unknown'}
                                </div>
                                <div className="text-sm text-slate-400">
                                  {new Date(assignment.assigned_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${
                                assignment.status === 'active' ? 'bg-green-500/20 text-green-300 border-green-500/30' :
                                assignment.status === 'completed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                                'bg-slate-500/20 text-slate-300 border-slate-500/30'
                              }`}>
                                {assignment.status}
                              </span>
                              {assignment.status === 'active' && (
                                <button
                                  onClick={() => handleUnassign(assignment.id)}
                                  className="
                                    px-3 py-1 rounded-lg
                                    bg-red-500/20 hover:bg-red-500/30
                                    border border-red-500/30 hover:border-red-500/50
                                    text-red-300 text-sm
                                    transition-all
                                  "
                                >
                                  Unassign
                                </button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                ))
              )}
            </div>
          )}
        </>
      )}
        </div>
      </div>
    </div>
    </div>
  );
}