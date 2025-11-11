import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock apiFetch using factory (avoids top-level var hoisting issues)
vi.mock('../lib/apiClient', () => {
  return { apiFetch: vi.fn() };
});

import AIInsightsPanel from '../components/ai/AIInsightsPanel.jsx';
import { apiFetch } from '../lib/apiClient';

describe('AIInsightsPanel', () => {
  const baseProps = { caseId: 'case-1', userId: 'user-1', userRole: 'divorcee', onOpenAI: vi.fn() };

  beforeEach(() => {
    apiFetch.mockReset();
  });

  it('renders backend insights when ok=true', async () => {
  apiFetch.mockResolvedValueOnce({
      ok: true,
      insights: [
        {
          content: {
            progress_message: 'Backend says hi',
            progress_percent: 77,
            next_action: 'Do a thing',
            documents_uploaded: 3,
            messages_exchanged: 5,
            sessions_scheduled: 1,
            encouragement: ['Nice work']
          }
        }
      ]
    });

    render(<AIInsightsPanel {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText(/AI Insights & Next Steps/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/Backend says hi/i)).toBeInTheDocument();
    expect(screen.getByText('77% complete')).toBeInTheDocument();
    expect(screen.getByText(/Do a thing/i)).toBeInTheDocument();
  });

  it('falls back gracefully when fetch fails', async () => {
  apiFetch.mockRejectedValueOnce(new Error('network bad'));

    render(<AIInsightsPanel {...baseProps} />);

    await waitFor(() => {
      expect(screen.getByText(/AI Insights & Next Steps/i)).toBeInTheDocument();
    });

    // Fallback still shows the Ask AI button
    expect(screen.getByRole('button', { name: /Ask AI for Help/i })).toBeInTheDocument();
  });
});
