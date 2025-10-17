import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import CaseNotes from '../components/CaseNotes';
import notesFixture from './mocks/notes.json';

vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ session: null, user: null }),
}));

const defaultProps = {
  caseId: '123',
  currentUser: {
    id: 'user-1',
    name: 'Alex Mediator',
  },
};

const buildFetchMock = (implementations) => {
  const fetchMock = vi.fn(async (url, options = {}) => {
    const method = options.method || 'GET';
    const handler = implementations[method];
    if (!handler) {
      throw new Error(`No fetch handler registered for method ${method}`);
    }
    return handler(url, options);
  });
  global.fetch = fetchMock;
  return fetchMock;
};

describe('CaseNotes', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and displays existing notes', async () => {
    buildFetchMock({
      GET: async () => ({
        ok: true,
        json: async () => ({ data: notesFixture }),
      }),
    });

    render(<CaseNotes {...defaultProps} />);

    expect(screen.getByText(/Loading notes/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Discussed custody schedule/i)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases/123/notes'),
      expect.objectContaining({ signal: expect.any(Object) })
    );
  });

  it('allows adding a new note', async () => {
    const newNote = {
      id: 'note-3',
      case_id: 123,
      author_id: 'user-1',
      author_name: 'Alex Mediator',
      body: 'Coaching client through parenting plan updates.',
      created_at: '2025-09-24T10:00:00.000Z',
    };

    buildFetchMock({
      GET: async () => ({
        ok: true,
        json: async () => ({ data: notesFixture }),
      }),
      POST: async (_url, options) => {
        const payload = JSON.parse(options.body);
        expect(payload.body).toBe('Coaching client through parenting plan updates.');
        return {
          ok: true,
          json: async () => ({ data: newNote }),
        };
      },
    });

    render(<CaseNotes {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Discussed custody schedule/i)).toBeInTheDocument();
    });

    const textarea = screen.getByLabelText(/Add a new note/i);
    await userEvent.clear(textarea);
    await userEvent.type(textarea, newNote.body);

    const submitButton = screen.getByRole('button', { name: /Add Note/i });
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(newNote.body)).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases/123/notes'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('allows deleting an authored note', async () => {
    const fetchMock = buildFetchMock({
      GET: async () => ({
        ok: true,
        json: async () => ({ data: notesFixture }),
      }),
      DELETE: async () => {
        return {
          ok: true,
          json: async () => ({ data: notesFixture[0] }),
        };
      },
    });

    render(<CaseNotes {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Discussed custody schedule/i)).toBeInTheDocument();
    });

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(screen.queryByText(/Discussed custody schedule/i)).not.toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/cases/123/notes/note-1'),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
