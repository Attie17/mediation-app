import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../lib/apiClient';

const formatTimestamp = (value) => {
  if (!value) return 'Unknown date';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (err) {
    return value;
  }
};

const getDefaultUser = () => ({ id: '', name: 'Unknown User' });

const CaseNotes = ({
  caseId,
  currentUser,
  canCreate = true,
  canDeleteOwn = true,
  maxVisible = null,
  showHeader = true,
  authToken,
}) => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [noteBody, setNoteBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState(null);

  const safeUser = useMemo(() => currentUser || getDefaultUser(), [currentUser]);
  const displayNotes = useMemo(
    () => (maxVisible ? notes.slice(0, maxVisible) : notes),
    [notes, maxVisible],
  );

  useEffect(() => {
    if (!caseId) return;
    const controller = new AbortController();

    const loadNotes = async () => {
      setLoading(true);
      setError(null);
      try {
        const payload = await apiFetch(`/api/cases/${caseId}/notes`, {
          signal: controller.signal,
        });
        setNotes(Array.isArray(payload.data) ? payload.data : []);
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || 'An unexpected error occurred while loading notes.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadNotes();

    return () => controller.abort();
  }, [caseId]);

  const handleAddNote = async (event) => {
    event.preventDefault();
    if (!canCreate) return;
    if (!noteBody.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = await apiFetch(`/api/cases/${caseId}/notes`, {
        method: 'POST',
        body: JSON.stringify({ body: noteBody.trim() }),
      });

      const newNote = payload?.data
        ? {
            ...payload.data,
            author_name: payload.data.author_name || safeUser.name || 'Unknown User',
          }
        : {
            id: crypto.randomUUID(),
            case_id: Number(caseId),
            author_id: safeUser.id,
            author_name: safeUser.name || 'Unknown User',
            body: noteBody.trim(),
            created_at: new Date().toISOString(),
          };

      setNotes((prev) => [newNote, ...prev]);
      setNoteBody('');
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while adding the note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (noteId) => {
    if (!noteId || deletingNoteId || !canDeleteOwn) return;

    setDeletingNoteId(noteId);
    setError(null);

    try {
      await apiFetch(`/api/cases/${caseId}/notes/${noteId}`, {
        method: 'DELETE',
      });

      setNotes((prev) => prev.filter((note) => note.id !== noteId));
    } catch (err) {
      setError(err.message || 'An unexpected error occurred while deleting the note.');
    } finally {
      setDeletingNoteId(null);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow">
      {showHeader && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Case Notes</h2>
            <p className="text-sm text-gray-500 mt-1">Capture important updates and mediation context.</p>
          </div>
        </div>
      )}

      <div className="px-6 py-6 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {canCreate && (
          <form onSubmit={handleAddNote} className="space-y-3">
            <label htmlFor="case-note-input" className="block text-sm font-medium text-gray-700">
              Add a new note
            </label>
            <textarea
              id="case-note-input"
              className="w-full min-h-[100px] rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Document key decisions, concerns, or next steps..."
              value={noteBody}
              onChange={(event) => setNoteBody(event.target.value)}
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300 rounded-md shadow-sm"
                disabled={isSubmitting || !noteBody.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Add Note'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-400 mr-3"></div>
            Loading notes...
          </div>
        ) : displayNotes.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-lg p-6 text-center text-gray-500">
            No notes yet. {canCreate ? 'Start the conversation by adding one above.' : 'Check back later for updates.'}
          </div>
        ) : (
          <ul className="space-y-4">
            {displayNotes.map((note) => {
              const canDelete = canDeleteOwn && safeUser.id && note.author_id === safeUser.id;
              return (
                <li key={note.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{note.author_name || 'Unknown Author'}</p>
                      <p className="text-xs text-gray-500 mt-1">{formatTimestamp(note.created_at)}</p>
                    </div>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        disabled={deletingNoteId === note.id}
                        className="text-sm text-red-600 hover:text-red-700 disabled:text-red-300"
                      >
                        {deletingNoteId === note.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{note.body}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
};

export default CaseNotes;
