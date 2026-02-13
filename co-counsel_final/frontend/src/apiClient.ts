import { API_BASE_URL } from '@/config';

// Lightweight API client that prefixes all paths with the configured API base URL.
export async function fetchFromApi(path: string, init?: RequestInit) {
  const url = new URL(path, API_BASE_URL).toString();
  return fetch(url, init);
}

export async function parseJsonResponse<T>(response: Response, label: string): Promise<T> {
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const preview = (await response.text()).slice(0, 160);
    throw new Error(`Unexpected response while parsing ${label}: ${preview || '<empty body>'}`);
  }
  return (await response.json()) as T;
}

export async function getFromApi(path: string) {
  const res = await fetchFromApi(path, { method: 'GET' });
  return res.json();
}
