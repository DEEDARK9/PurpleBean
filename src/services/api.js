const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const endpoints = {
  products: `${API_BASE_URL}/products`,
  admins: `${API_BASE_URL}/admins`,
  sessions: `${API_BASE_URL}/sessions`,
};

export async function request(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Request failed');
  }

  return response.json();
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};

