import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';

// Stable navigate mock for assertions
const navigateMock = vi.fn();

// Mock react-router-dom's useNavigate to return our stable mock
vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock
}));

// Test notifications covering all reply resolution branches
const testNotifications = [
  {
    id: 'n-action',
    read: false,
    title: 'Action URL',
    message: 'Message',
    type: 'message',
    priority: 'normal',
    created_at: new Date().toISOString(),
    action_url: '/communications?conversation=abc',
    metadata: {}
  },
  {
    id: 'n-conv',
    read: false,
    title: 'Conversation',
    message: 'Message',
    type: 'message',
    priority: 'normal',
    created_at: new Date().toISOString(),
    metadata: { conversation_id: 'conv123' }
  },
  {
    id: 'n-case',
    read: false,
    title: 'Case',
    message: 'Message',
    type: 'message',
    priority: 'normal',
    created_at: new Date().toISOString(),
    metadata: { case_id: 'case789' }
  },
  {
    id: 'n-user',
    read: false,
    title: 'User',
    message: 'Message',
    type: 'message',
    priority: 'normal',
    created_at: new Date().toISOString(),
    metadata: { sender_id: 'user555' }
  },
  {
    id: 'n-fallback',
    read: false,
    title: 'Fallback',
    message: 'Message',
    type: 'message',
    priority: 'normal',
    created_at: new Date().toISOString(),
    metadata: {}
  }
];

// Mock apiFetch to supply notifications and handle mark read calls
vi.mock('../lib/apiClient', () => ({
  apiFetch: vi.fn(async (url, init = {}) => {
    if (url.includes('/api/notifications/user/')) {
      return { notifications: testNotifications };
    }
    // Mark read / delete endpoints just return ok-ish response
    return { ok: true };
  })
}));

import NotificationCenter from '../components/notifications/NotificationCenter.jsx';
import { apiFetch } from '../lib/apiClient';

describe('NotificationCenter Reply navigation', () => {
  const baseProps = { userId: 'user-1', userRole: 'mediator', isOpen: true };

  beforeEach(() => {
    navigateMock.mockReset();
    // Ensure modules use fresh mocks each test (optional clear for apiFetch)
    apiFetch.mockClear();
  });

  it('renders fetched notifications', async () => {
    render(<NotificationCenter {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText('Action URL')).toBeInTheDocument();
    });
    testNotifications.forEach(n => {
      expect(screen.getByText(n.title)).toBeInTheDocument();
    });
  });

  it('navigates using precedence chain (action_url → conversation → case → user → fallback)', async () => {
    render(<NotificationCenter {...baseProps} />);
    await waitFor(() => {
      expect(screen.getByText('Action URL')).toBeInTheDocument();
    });

    // Strategy: locate each notification card by title then its Reply button for deterministic ordering
    const expectedMatrix = [
      { title: 'Action URL', route: '/communications?conversation=abc' },
      { title: 'Conversation', route: '/communications?conversation=conv123' },
      { title: 'Case', route: '/communications?case=case789' },
      { title: 'User', route: '/communications?user=user555' },
      { title: 'Fallback', route: '/communications' }
    ];

    for (const { title, route } of expectedMatrix) {
      const cardTitle = screen.getByText(title);
      // Traverse up to card container and find the Reply button within it
      const card = cardTitle.closest('div');
      const replyBtn = within(card.parentElement).getByRole('button', { name: /Reply/i });
      fireEvent.click(replyBtn);
      await waitFor(() => {
        expect(navigateMock).toHaveBeenCalledWith(route);
      });
      navigateMock.mockClear();
    }
  });
});

