import { useState, useEffect } from 'react';

interface AuthState {
  token: string | null;
  characterId: number | null;
  characterName: string | null;
}

const STORAGE_KEY = 'accessToken';

const _listeners = new Set<(token: string | null) => void>();

function isExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() / 1000 > (payload.exp as number);
}

const _stored = localStorage.getItem(STORAGE_KEY);
let _token: string | null = (_stored && !isExpired(_stored)) ? _stored : null;
if (_stored && !_token) localStorage.removeItem(STORAGE_KEY);

export function setAccessToken(token: string | null) {
  _token = token;
  if (token) {
    localStorage.setItem(STORAGE_KEY, token);
  } else {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('refreshToken');
  }
  _listeners.forEach(fn => fn(token));
}

export function getAccessToken(): string | null {
  return _token;
}

export function clearAccessToken() {
  setAccessToken(null);
}

/** Expiry (epoch seconds) of the current access token, or null if none/unknown. */
export function getAccessTokenExp(): number | null {
  if (!_token) return null;
  const exp = decodeJwtPayload(_token)?.exp;
  return typeof exp === 'number' ? exp : null;
}

// Exchange the stored refresh token for a fresh access token. Concurrent calls share
// one in-flight request. Uses fetch (not apiClient) to avoid an interceptor cycle and
// to send the refresh token in the body rather than the (possibly expired) bearer.
let _refreshInFlight: Promise<boolean> | null = null;

export function refreshAccessToken(): Promise<boolean> {
  if (_refreshInFlight) return _refreshInFlight;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return Promise.resolve(false);

  _refreshInFlight = fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  })
    .then(async (res) => {
      if (!res.ok) {
        // Refresh token rejected (expired/invalid) — the session is over.
        clearAccessToken();
        return false;
      }
      const data = await res.json();
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        return true;
      }
      clearAccessToken();
      return false;
    })
    .catch(() => false) // transient network error — keep the session, retry later
    .finally(() => { _refreshInFlight = null; });

  return _refreshInFlight;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function buildState(token: string | null): AuthState {
  if (!token) return { token: null, characterId: null, characterName: null };
  const payload = decodeJwtPayload(token);
  return {
    token,
    characterId: payload?.sub ? Number(payload.sub) : null,
    characterName: payload?.name as string | null ?? null,
  };
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>(() => buildState(_token));

  useEffect(() => {
    const update = (token: string | null) => setState(buildState(token));
    _listeners.add(update);
    return () => { _listeners.delete(update); };
  }, []);

  return state;
}
