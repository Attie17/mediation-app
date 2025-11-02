import { useEffect } from 'react';

/**
 * useKeyboardShortcuts - Add keyboard shortcuts to your React components
 * @param {Object} shortcuts - Map of key to handler function
 * @param {boolean} enabled - Whether shortcuts are enabled (default: true)
 * 
 * @example
 * useKeyboardShortcuts({
 *   'c': () => setChatOpen(true),
 *   '?': () => setShowHelp(true),
 *   'Escape': () => closeModal()
 * });
 */
export function useKeyboardShortcuts(shortcuts, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyPress = (event) => {
      // Don't trigger shortcuts when typing in inputs or textareas
      const activeElement = document.activeElement;
      const isTyping = 
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.isContentEditable;
      
      if (isTyping && event.key !== 'Escape') {
        return;
      }

      // Check if this key has a handler
      const handler = shortcuts[event.key];
      if (handler) {
        event.preventDefault();
        handler(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [shortcuts, enabled]);
}

/**
 * KeyboardShortcutsHelper - Component to display available shortcuts
 */
export function KeyboardShortcutsHelper({ shortcuts, isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcutList = Object.entries(shortcuts).map(([key, description]) => ({
    key: key === ' ' ? 'Space' : key,
    description: typeof description === 'string' ? description : 'Action'
  }));

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4">⌨️ Keyboard Shortcuts</h3>
        <div className="space-y-2 mb-6">
          {shortcutList.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between py-2 border-b border-slate-700">
              <span className="text-slate-300">{description}</span>
              <kbd className="px-3 py-1 bg-slate-900 border border-slate-600 rounded text-sm font-mono text-teal-400">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg transition-colors font-medium"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}

export default useKeyboardShortcuts;
