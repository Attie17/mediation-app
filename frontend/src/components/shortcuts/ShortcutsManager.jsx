import React, { useState, useEffect } from 'react';
import { Keyboard, Save, RotateCcw, X } from 'lucide-react';

export default function ShortcutsManager({ isOpen, onClose, userRole = 'mediator' }) {
  const [shortcuts, setShortcuts] = useState({});
  const [customShortcuts, setCustomShortcuts] = useState({});
  const [editing, setEditing] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  const defaultShortcuts = {
    mediator: {
      'a': { label: 'Open AI Assistant', action: 'openAI' },
      'c': { label: 'Create new case', action: 'createCase' },
      'r': { label: 'Go to review page', action: 'goToReview' },
      'p': { label: 'Privacy policy', action: 'openPrivacy' },
      'g': { label: 'Mediator guide', action: 'openGuide' },
      'f': { label: 'FAQ', action: 'openFAQ' },
      '?': { label: 'Show shortcuts help', action: 'showShortcuts' },
      'Escape': { label: 'Close modals', action: 'closeModals' }
    },
    divorcee: {
      'a': { label: 'Open AI Assistant', action: 'openAI' },
      'p': { label: 'Privacy policy', action: 'openPrivacy' },
      'g': { label: 'What to expect guide', action: 'openGuide' },
      'f': { label: 'FAQ', action: 'openFAQ' },
      '?': { label: 'Show shortcuts help', action: 'showShortcuts' },
      'Escape': { label: 'Close modals', action: 'closeModals' }
    }
  };

  useEffect(() => {
    // Load custom shortcuts from localStorage
    const saved = localStorage.getItem(`shortcuts_${userRole}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setCustomShortcuts(parsed);
      setShortcuts({ ...defaultShortcuts[userRole], ...parsed });
    } else {
      setShortcuts(defaultShortcuts[userRole]);
    }
  }, [userRole]);

  const handleKeyChange = (oldKey, newKey) => {
    if (newKey === oldKey) {
      setEditing(null);
      return;
    }

    // Check if new key is already in use
    if (shortcuts[newKey]) {
      alert(`Key "${newKey}" is already assigned to: ${shortcuts[newKey].label}`);
      return;
    }

    const updated = { ...shortcuts };
    updated[newKey] = updated[oldKey];
    delete updated[oldKey];

    setShortcuts(updated);
    setCustomShortcuts(prev => {
      const custom = { ...prev };
      custom[newKey] = updated[newKey];
      delete custom[oldKey];
      return custom;
    });
    setHasChanges(true);
    setEditing(null);
  };

  const handleSave = () => {
    localStorage.setItem(`shortcuts_${userRole}`, JSON.stringify(customShortcuts));
    setHasChanges(false);
    alert('Keyboard shortcuts saved! Refresh the page to apply changes.');
  };

  const handleReset = () => {
    if (confirm('Reset all shortcuts to default? This cannot be undone.')) {
      localStorage.removeItem(`shortcuts_${userRole}`);
      setShortcuts(defaultShortcuts[userRole]);
      setCustomShortcuts({});
      setHasChanges(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-600 rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-500/20 rounded-lg">
                <Keyboard className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-100">Customize Keyboard Shortcuts</h2>
                <p className="text-sm text-slate-400 mt-1">Click on a key to change it</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {Object.entries(shortcuts).map(([key, config]) => {
              const isCustom = customShortcuts[key] !== undefined;
              const isEditing = editing === key;

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-slate-100 font-medium mb-1">{config.label}</p>
                    <p className="text-xs text-slate-400">Action: {config.action}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {isCustom && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-teal-500/20 text-teal-400">
                        Custom
                      </span>
                    )}
                    {isEditing ? (
                      <input
                        type="text"
                        maxLength={10}
                        defaultValue={key}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleKeyChange(key, e.target.value);
                          } else if (e.key === 'Escape') {
                            setEditing(null);
                          }
                        }}
                        onBlur={(e) => handleKeyChange(key, e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-teal-500 rounded-lg text-slate-100 font-mono text-sm w-24 text-center focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <button
                        onClick={() => setEditing(key)}
                        className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-600 hover:border-teal-500 rounded-lg transition-colors font-mono text-sm font-semibold text-slate-100 min-w-[60px]"
                      >
                        {key}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex items-center justify-between bg-slate-800/50">
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
