import { API_BASE_URL } from '@/config';

// Lightweight API client that prefixes all paths with the configured API base URL.
export async function fetchFromApi(path: string, init?: RequestInit) {
  const url = new URL(path, API_BASE_URL).toString();
  return fetch(url, init);
}

export async function getFromApi(path: string) {
  const res = await fetchFromApi(path, { method: 'GET' });
  return res.json();
}

export async function parseJsonResponse<T>(response: Response, label = 'API response'): Promise<T> {
  const text = await response.text();
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Unexpected response for ${label}: received non-JSON payload`);
  }
}
