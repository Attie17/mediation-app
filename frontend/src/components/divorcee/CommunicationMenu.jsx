import React from 'react';
import { MessageSquare, Users, UsersRound, Shield, Sparkles, X } from 'lucide-react';

export default function CommunicationMenu({ isOpen, onClose, onSelectOption }) {
  if (!isOpen) return null;

  const communicationOptions = [
    {
      id: 'mediator',
      label: 'Talk to Mediator',
      description: 'Direct message with your mediator',
      icon: Shield,
      color: 'from-blue-500 to-blue-600',
      action: () => onSelectOption('mediator')
    },
    {
      id: 'other-divorcee',
      label: 'Talk to Other Divorcee',
      description: 'Private chat with the other party',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      action: () => onSelectOption('other-divorcee')
    },
    {
      id: 'group-of-3',
      label: 'Group of 3',
      description: 'Group chat with mediator and other party',
      icon: UsersRound,
      color: 'from-green-500 to-green-600',
      action: () => onSelectOption('group-of-3')
    },
    {
      id: 'admin',
      label: 'Contact Admin',
      description: 'Technical support and platform help',
      icon: Users,
      color: 'from-orange-500 to-orange-600',
      action: () => onSelectOption('admin')
    },
    {
      id: 'ai',
      label: 'Ask AI Assistant',
      description: 'Get instant answers to your questions',
      icon: Sparkles,
      color: 'from-cyan-500 to-cyan-600',
      action: () => onSelectOption('ai')
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Let's Talk</h2>
            <p className="text-sm text-gray-600 mt-1">Choose who you'd like to communicate with</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="p-6 grid gap-4">
          {communicationOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={option.action}
                className="group relative overflow-hidden bg-white border-2 border-gray-200 hover:border-gray-300 rounded-xl p-6 text-left transition-all hover:shadow-lg hover:scale-[1.02]"
              >
                {/* Gradient Background on Hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                
                <div className="relative flex items-start gap-4">
                  {/* Icon */}
                  <div className={`flex-shrink-0 p-3 bg-gradient-to-br ${option.color} rounded-xl shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Content */}
                  <div className="flex-grow min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {option.label}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {option.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-600 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4">
          <p className="text-xs text-gray-500 text-center">
            All conversations are private and secure. Messages are saved to your case history.
          </p>
        </div>
      </div>
    </div>
  );
}
