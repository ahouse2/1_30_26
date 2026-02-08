// Runtime-configurable API base URL
// In docker, this is injected via VITE_API_BASE_URL; fallback to localhost for local dev.
export const API_BASE_URL: string = (import.meta.env.VITE_API_BASE_URL as string) ?? 'http://localhost:8000';

export const buildApiUrl = (path: string): string => new URL(path, API_BASE_URL).toString();
