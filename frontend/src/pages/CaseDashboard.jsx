import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import CaseParticipants from '../components/CaseParticipants';
import CaseNotes from '../components/CaseNotes';
import NotificationsList from '../components/NotificationsList';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

const StatusPill = ({ status }) => {
  if (!status) return null;
  const normalized = status.toLowerCase();
  const classes = {
    active: 'bg-green-100 text-green-800',
    open: 'bg-green-100 text-green-800',
    confirmed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    rejected: 'bg-red-100 text-red-800',
    closed: 'bg-gray-100 text-gray-700',
  };
  const label = status.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[normalized] || 'bg-gray-100 text-gray-700'}`}>
      {label}
    </span>
  );
};

const RequirementRow = ({ requirement }) => {
  const status = requirement?.status || 'missing';
  const latest = requirement?.latest_upload;
  const statusDisplay = {
    confirmed: { label: 'Confirmed', classes: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-800' },
    pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-800' },
    uploaded: { label: 'Uploaded', classes: 'bg-blue-100 text-blue-800' },
    missing: { label: 'Missing', classes: 'bg-gray-100 text-gray-700' },
  }[status] || { label: status, classes: 'bg-gray-100 text-gray-700' };

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50">
      <td className="px-4 py-3 text-sm text-gray-900">
        {requirement.doc_type?.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
      </td>
      <td className="px-4 py-3 text-sm">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusDisplay.classes}`}>
          {statusDisplay.label}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {requirement.required ? 'Required' : 'Optional'}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500">
        {latest ? new Date(latest.created_at).toLocaleString() : '—'}
      </td>
    </tr>
  );
};

const CaseDashboard = () => {
  const { caseId } = useParams();
  const { session, user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const accessToken = session?.access_token;
  const viewerRole = dashboard?.viewer_role || 'participant';
  const isMediator = viewerRole === 'mediator';

  const currentUserId = user?.id || session?.user?.id || null;

  const userParticipant = useMemo(() => {
    if (!dashboard || !currentUserId) return null;
    return dashboard.participants?.find((participant) => participant.user_id === currentUserId) || null;
  }, [dashboard, currentUserId]);

  useEffect(() => {
    const controller = new AbortController();

    const loadDashboard = async () => {
      if (!caseId) return;

      setLoading(true);
      setError(null);
      try {
        const payload = await apiFetch(`/api/cases/${caseId}/dashboard`, {
          signal: controller.signal,
        });
        setDashboard(payload);
      } catch (err) {
        if (err.name === 'AbortError') return;
        console.error('Error loading case dashboard:', err);
        setError(err.message || 'Unexpected error loading dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();

    return () => controller.abort();
  }, [caseId, accessToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-t-4 border-blue-500" />
            <p className="ml-3 text-gray-600">Loading case dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800">Unable to load dashboard</h2>
            <p className="mt-2 text-sm text-red-700">{error}</p>
            <div className="mt-4">
              <Link to={`/cases/${caseId}`} className="text-blue-600 hover:text-blue-500 text-sm font-medium">
                Return to case details
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  const caseRecord = dashboard.case || {};
  const notesLimit = 5;

  return (
    <div className="min-h-screen bg-gray-100 py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <header className="bg-white shadow rounded-lg p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">Case #{caseRecord.id}</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-1">Case Dashboard</h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <StatusPill status={caseRecord.status} />
                {caseRecord.created_at && (
                  <span>Created {new Date(caseRecord.created_at).toLocaleString()}</span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  Viewing as {viewerRole}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <Link
                to={`/cases/${caseId}`}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                View case overview
              </Link>
              {isMediator && (
                <Link
                  to={`/cases/${caseId}/details`}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm text-sm"
                >
                  Manage full case
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Notes</h2>
                  <p className="text-sm text-gray-500">Latest updates from mediators and participants.</p>
                </div>
                <Link
                  to={`/cases/${caseId}`}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View all notes
                </Link>
              </div>
              <div className="px-6 py-6">
                <CaseNotes
                  caseId={caseId}
                  currentUser={{ id: currentUserId || '', name: user?.email || 'User' }}
                  canCreate={isMediator}
                  canDeleteOwn={true}
                  maxVisible={notesLimit}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Document Requirements</h2>
                <p className="text-sm text-gray-500">Track outstanding uploads and their statuses.</p>
              </div>
              <div className="px-6 py-4">
                {dashboard.requirements_available ? (
                  dashboard.requirements && dashboard.requirements.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirement</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latest Upload</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {dashboard.requirements.map((requirement) => (
                            <RequirementRow key={requirement.id} requirement={requirement} />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No requirements configured for this case yet.</div>
                  )
                ) : (
                  <div className="text-sm text-gray-500">
                    Requirements tracking isn't available yet. This section will populate once the schema is deployed.
                  </div>
                )}
              </div>
            </div>
          </div>

          <aside className="space-y-6">
            <NotificationsList />

            {isMediator ? (
              <CaseParticipants caseId={caseId} userRole="mediator" />
            ) : (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900">Your participation</h2>
                {userParticipant ? (
                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Role</span>
                      <StatusPill status={userParticipant.role} />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-500">Status</span>
                      <StatusPill status={userParticipant.status || 'active'} />
                    </div>
                    {userParticipant.created_at && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Joined</span>
                        <span>{new Date(userParticipant.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    You're viewing this case as a guest. Contact your mediator for more details.
                  </p>
                )}
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900">Latest uploads</h2>
              {dashboard.uploads_summary && dashboard.uploads_summary.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {dashboard.uploads_summary.slice(0, 5).map((upload) => (
                    <li key={upload.id} className="border border-gray-200 rounded-md px-3 py-2 text-sm text-gray-700">
                      <div className="font-medium">
                        {upload.doc_type?.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())}
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                        <span>{new Date(upload.created_at).toLocaleString()}</span>
                        <StatusPill status={upload.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-gray-500">No uploads linked to this case yet.</p>
              )}
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
};

export default CaseDashboard;