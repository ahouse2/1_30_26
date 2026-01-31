// Lightweight API client that prefixes all paths with the configured API base URL.
export async function fetchFromApi(path: string, init?: RequestInit) {
  const base = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000';
  const url = new URL(path, base).toString();
  return fetch(url, init);
}

export async function getFromApi(path: string) {
  const res = await fetchFromApi(path, { method: 'GET' });
  return res.json();
}
