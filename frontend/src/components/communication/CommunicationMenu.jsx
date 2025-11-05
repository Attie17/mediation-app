import React, { useState, useEffect } from 'react';
import { MessageSquare, Users, UsersRound, Shield, Sparkles, X, ChevronDown } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

export default function CommunicationMenu({ isOpen, onClose, onSelectOption, userRole }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Define options based on user role
  const getRoleOptions = () => {
    switch(userRole) {
      case 'divorcee':
        return [
          {
            id: 'mediator',
            label: 'Your Mediator',
            description: 'Direct message',
            icon: Shield,
            color: 'from-blue-500 to-blue-600',
            action: () => onSelectOption('mediator')
          },
          {
            id: 'other-divorcee',
            label: 'Other Party',
            description: 'Private chat',
            icon: MessageSquare,
            color: 'from-purple-500 to-purple-600',
            action: () => onSelectOption('other-divorcee')
          },
          {
            id: 'group-of-3',
            label: 'Group Chat',
            description: 'With mediator & other party',
            icon: UsersRound,
            color: 'from-green-500 to-green-600',
            action: () => onSelectOption('group-of-3')
          },
          {
            id: 'admin',
            label: 'Support',
            description: 'Technical help',
            icon: Users,
            color: 'from-orange-500 to-orange-600',
            action: () => onSelectOption('admin')
          },
          {
            id: 'ai',
            label: 'AI Assistant',
            description: 'Get instant answers',
            icon: Sparkles,
            color: 'from-cyan-500 to-cyan-600',
            action: () => onSelectOption('ai')
          }
        ];

      case 'mediator':
        return [
          {
            id: 'divorcees',
            label: 'Message Divorcees',
            description: 'Select a case participant',
            icon: Users,
            color: 'from-purple-500 to-purple-600',
            action: () => onSelectOption('divorcee')
          },
          {
            id: 'group',
            label: 'Group Chat',
            description: 'Chat with all case parties',
            icon: UsersRound,
            color: 'from-green-500 to-green-600',
            action: () => onSelectOption('group')
          },
          {
            id: 'lawyers',
            label: 'Message Lawyers',
            description: 'Communicate with legal counsel',
            icon: Shield,
            color: 'from-blue-500 to-blue-600',
            action: () => onSelectOption('lawyer')
          },
          {
            id: 'admin',
            label: 'Contact Admin',
            description: 'Platform support',
            icon: Users,
            color: 'from-orange-500 to-orange-600',
            action: () => onSelectOption('admin')
          },
          {
            id: 'ai',
            label: 'AI Assistant',
            description: 'Process guidance',
            icon: Sparkles,
            color: 'from-cyan-500 to-cyan-600',
            action: () => onSelectOption('ai')
          }
        ];

      case 'lawyer':
        return [
          {
            id: 'client',
            label: 'Your Client',
            description: 'Private communication',
            icon: MessageSquare,
            color: 'from-purple-500 to-purple-600',
            action: () => onSelectOption('divorcee')
          },
          {
            id: 'mediator',
            label: 'Case Mediator',
            description: 'Coordinate with mediator',
            icon: Shield,
            color: 'from-blue-500 to-blue-600',
            action: () => onSelectOption('mediator')
          },
          {
            id: 'admin',
            label: 'Contact Admin',
            description: 'Platform support',
            icon: Users,
            color: 'from-orange-500 to-orange-600',
            action: () => onSelectOption('admin')
          },
          {
            id: 'ai',
            label: 'AI Assistant',
            description: 'Legal workflow help',
            icon: Sparkles,
            color: 'from-cyan-500 to-cyan-600',
            action: () => onSelectOption('ai')
          }
        ];

      case 'admin':
        return [
          {
            id: 'mediators',
            label: 'Mediators',
            description: 'Select from list',
            icon: Shield,
            color: 'from-blue-500 to-blue-600',
            action: () => handleAdminSelect('mediator'),
            expandable: true
          },
          {
            id: 'divorcees',
            label: 'Divorcees',
            description: 'Select from list',
            icon: Users,
            color: 'from-purple-500 to-purple-600',
            action: () => handleAdminSelect('divorcee'),
            expandable: true
          },
          {
            id: 'lawyers',
            label: 'Lawyers',
            description: 'Select from list',
            icon: Shield,
            color: 'from-green-500 to-green-600',
            action: () => handleAdminSelect('lawyer'),
            expandable: true
          },
          {
            id: 'broadcast',
            label: 'Broadcast',
            description: 'Message all users',
            icon: UsersRound,
            color: 'from-orange-500 to-orange-600',
            action: () => onSelectOption('broadcast')
          },
          {
            id: 'ai',
            label: 'AI Assistant',
            description: 'System administration',
            icon: Sparkles,
            color: 'from-cyan-500 to-cyan-600',
            action: () => onSelectOption('ai')
          }
        ];

      default:
        return [];
    }
  };

  const handleAdminSelect = async (role) => {
    setSelectedCategory(role);
    setLoading(true);
    try {
      const response = await apiFetch(`/api/admin/users?role=${role}`);
      setAvailableUsers(response.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
      setAvailableUsers([]);
    }
    setLoading(false);
  };

  const handleUserSelect = (userId) => {
    onSelectOption('user', userId);
    setSelectedCategory(null);
    setAvailableUsers([]);
  };

  const communicationOptions = getRoleOptions();

  // If admin selected a category, show user list
  if (selectedCategory && userRole === 'admin') {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-slate-700">
          {/* Header */}
          <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white capitalize">Select {selectedCategory}</h3>
              <p className="text-xs text-slate-400 mt-0.5">Choose who to message</p>
            </div>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setAvailableUsers([]);
              }}
              className="p-1.5 hover:bg-slate-700 rounded transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* User List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-sm text-slate-400">Loading...</p>
              </div>
            ) : availableUsers.length === 0 ? (
              <div className="p-8 text-center">
                <Users className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No {selectedCategory}s found</p>
              </div>
            ) : (
              <div className="p-2">
                {availableUsers.map((user) => (
                  <button
                    key={user.user_id}
                    onClick={() => handleUserSelect(user.user_id)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-slate-700/50 rounded-lg transition-colors text-left"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">
                        {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-grow min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {user.first_name && user.last_name 
                          ? `${user.first_name} ${user.last_name}`
                          : user.email?.split('@')[0] || 'Unknown User'}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main menu
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-lg shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-slate-700">
        {/* Compact Header */}
        <div className="bg-slate-900/50 border-b border-slate-700 px-4 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Let's Talk</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choose your communication channel</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-700 rounded transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Compact Options List */}
        <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
          {communicationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.action}
                className="group w-full flex items-center gap-3 p-3 bg-slate-700/30 hover:bg-slate-700/60 rounded-lg transition-all border border-slate-700/50 hover:border-slate-600"
              >
                {/* Icon */}
                <div className={`flex-shrink-0 w-9 h-9 bg-gradient-to-br ${option.color} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                
                {/* Content */}
                <div className="flex-grow text-left min-w-0">
                  <h3 className="text-sm font-semibold text-white">
                    {option.label}
                  </h3>
                  <p className="text-xs text-slate-400 truncate">
                    {option.description}
                  </p>
                </div>

                {/* Indicator */}
                {option.expandable ? (
                  <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-300 transition-colors flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-slate-400 transition-colors">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Compact Footer */}
        <div className="bg-slate-900/30 border-t border-slate-700 px-4 py-2">
          <p className="text-xs text-slate-500 text-center">
            🔒 All conversations are private and secure
          </p>
        </div>
      </div>
    </div>
  );
}
