import { getToken } from './auth';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8787/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export const api = {
  auth: {
    signup: (email: string, password: string) =>
      fetchAPI('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),

    login: (email: string, password: string) =>
      fetchAPI('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }),
  },

  avatars: {
    list: () => fetchAPI('/avatars'),
    get: (id: string) => fetchAPI(`/avatars/${id}`),
  },

  conversations: {
    start: (avatarId: string) =>
      fetchAPI('/conversations/start', {
        method: 'POST',
        body: JSON.stringify({ avatarId }),
      }),

    list: () => fetchAPI('/conversations'),

    get: (id: string) => fetchAPI(`/conversations/${id}`),

    getMessages: (id: string, limit = 50, offset = 0) =>
      fetchAPI(`/conversations/${id}/messages?limit=${limit}&offset=${offset}`),

    delete: (id: string) =>
      fetchAPI(`/conversations/${id}`, { method: 'DELETE' }),
  },

  payments: {
    createCheckout: (tier: 'standard' | 'premium') =>
      fetchAPI('/payments/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ tier }),
      }),

    getSubscription: () => fetchAPI('/payments/subscription'),
  },
};
