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
