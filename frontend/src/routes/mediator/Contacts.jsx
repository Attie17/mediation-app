import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL, API_ENDPOINTS, getAuthHeaders } from '../../config/api';
import { Users, Search, Mail, Phone, Briefcase, User, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card-enhanced';
import AIInsightsPanel from '../../components/ai/AIInsightsPanel';

export default function MediatorContacts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    fetchParticipants();
  }, [user]);

  const fetchParticipants = async () => {
    if (!user?.user_id) return;
    
    try {
      setLoading(true);
      const headers = getAuthHeaders();
      
      // Fetch all cases for this mediator
      const casesResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.cases.list(user.user_id)}`, {
        headers
      });
      
      if (casesResponse.ok) {
        const casesData = await casesResponse.json();
        const cases = casesData.cases || [];
        
        // Collect all unique participants from all cases
        const participantsMap = new Map();
        
        for (const caseItem of cases) {
          if (caseItem.id) {
            // Fetch participants for each case
            const participantsResponse = await fetch(
              `${API_BASE_URL}${API_ENDPOINTS.cases.participants(caseItem.id)}`,
              { headers }
            );
            
            if (participantsResponse.ok) {
              const participantsData = await participantsResponse.json();
              const caseParticipants = participantsData.participants || [];
              
              caseParticipants.forEach(p => {
                const key = p.user_id || p.email;
                if (!participantsMap.has(key)) {
                  participantsMap.set(key, {
                    ...p,
                    cases: [{ id: caseItem.id, title: caseItem.title }]
                  });
                } else {
                  const existing = participantsMap.get(key);
                  existing.cases.push({ id: caseItem.id, title: caseItem.title });
                }
              });
            }
          }
        }
        
        setParticipants(Array.from(participantsMap.values()));
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipants = participants.filter(p => {
    const matchesSearch = 
      p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || p.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role) => {
    const colors = {
      divorcee: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      lawyer: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
      mediator: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      admin: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
    };
    return colors[role] || 'bg-slate-500/20 text-slate-300 border-slate-500/30';
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'divorcee': return <User className="w-4 h-4" />;
      case 'lawyer': return <Briefcase className="w-4 h-4" />;
      case 'mediator': return <Users className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
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
        <div>
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Contacts & Participants</h1>
            <p className="text-slate-400">Manage all participants across your cases</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50"
              >
                <option value="all">All Roles</option>
                <option value="divorcee">Divorcees</option>
                <option value="lawyer">Lawyers</option>
                <option value="mediator">Mediators</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Contacts List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Loading contacts...</p>
          </div>
        ) : filteredParticipants.length === 0 ? (
          <Card className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-300 mb-2">No contacts found</h3>
              <p className="text-slate-400">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : 'No participants in your cases yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParticipants.map((participant, idx) => (
              <Card 
                key={idx}
                className="bg-slate-800/50 border-slate-700/50 hover:border-teal-500/50 transition-all"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500/20 to-blue-500/20 flex items-center justify-center">
                        {getRoleIcon(participant.role)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {participant.name || 'Unknown'}
                        </h3>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getRoleColor(participant.role)}`}>
                          {participant.role || 'participant'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {participant.email && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Mail className="w-4 h-4" />
                        <span className="truncate">{participant.email}</span>
                      </div>
                    )}
                    {participant.phone && (
                      <div className="flex items-center gap-2 text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{participant.phone}</span>
                      </div>
                    )}
                  </div>

                  {participant.cases && participant.cases.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <p className="text-xs text-slate-400 mb-2">
                        Active in {participant.cases.length} case{participant.cases.length !== 1 ? 's' : ''}:
                      </p>
                      <div className="space-y-1">
                        {participant.cases.slice(0, 2).map((caseItem, i) => (
                          <button
                            key={i}
                            onClick={() => navigate(`/case/${caseItem.id}`)}
                            className="block w-full text-left text-xs text-teal-400 hover:text-teal-300 transition-colors truncate"
                          >
                            → {caseItem.title || 'Untitled Case'}
                          </button>
                        ))}
                        {participant.cases.length > 2 && (
                          <p className="text-xs text-slate-500">
                            +{participant.cases.length - 2} more
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Summary */}
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-white">{participants.length}</div>
                <div className="text-sm text-slate-400">Total Contacts</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">
                  {participants.filter(p => p.role === 'divorcee').length}
                </div>
                <div className="text-sm text-slate-400">Divorcees</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">
                  {participants.filter(p => p.role === 'lawyer').length}
                </div>
                <div className="text-sm text-slate-400">Lawyers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-teal-400">
                  {participants.filter(p => p.role === 'mediator').length}
                </div>
                <div className="text-sm text-slate-400">Mediators</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
