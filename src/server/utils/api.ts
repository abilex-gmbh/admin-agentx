import { ensureFreshBearer, refreshOn401 } from './refresh';
import { getServerApiUrl } from './url';

/** Skew window: refresh proactively when the bearer is within this of expiry. */
const PROACTIVE_REFRESH_SKEW_MS = 30_000;

/**
 * Make an authenticated request to the LibreChat API.
 *
 * Centralises bearer freshness: refreshes proactively when `expiresAt` is
 * within {@link PROACTIVE_REFRESH_SKEW_MS} of now, persists any rotated
 * refresh token to the session, and retries the original request once on a
 * 401 (so a token that expired between the freshness check and the request
 * landing still recovers without bubbling the failure up to the caller).
 *
 * @throws {Error} If no session bearer is available even after a refresh
 *   attempt.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const initialToken = await ensureFreshBearer(PROACTIVE_REFRESH_SKEW_MS);
  if (!initialToken) {
    throw new Error('No admin session token available');
  }

  const url = `${getServerApiUrl()}${path}`;
  const buildInit = (token: string): RequestInit => ({
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const response = await fetch(url, buildInit(initialToken));
  if (response.status !== 401) {
    return response;
  }

  const refreshedToken = await refreshOn401();
  if (!refreshedToken) {
    return response;
  }
  return fetch(url, buildInit(refreshedToken));
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function readApiErrorMessage(response: Response, fallback: string): Promise<string> {
  const rawText = await response.text().catch(() => '');

  if (rawText) {
    try {
      const body = JSON.parse(rawText) as { error?: string; message?: string };
      const message = body.error ?? body.message;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    } catch {
      const text = stripHtmlTags(rawText);
      if (text) {
        return text;
      }
    }
  }

  return `${fallback}: ${response.status}`;
}

/**
 * Extract an error message from a failed API response and throw.
 * Handles both `{ error }` and `{ message }` response shapes.
 */
export async function extractApiError(response: Response, fallback: string): Promise<never> {
  throw new Error(await readApiErrorMessage(response, fallback));
}
