import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken } from './useAuth';
import { apiClient } from '../api/axiosClient';

function parseJwtSub(token: string): string | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.sub ?? null;
  } catch {
    return null;
  }
}

export default function AuthCallback() {
  const navigate = useNavigate();
  const called = useRef(false);

  useEffect(() => {
    console.log('[AuthCallback] effect fired, called.current=', called.current);
    if (called.current) return;
    called.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    console.log('[AuthCallback] code=', code, 'state=', state, 'search=', window.location.search);

    if (!code || !state) {
      console.log('[AuthCallback] missing params, redirecting home');
      navigate('/', { replace: true });
      return;
    }

    console.log('[AuthCallback] calling /auth/callback');
    apiClient.get('/auth/callback', { params: { code, state } })
      .then(res => {
        console.log('[AuthCallback] success', res.data);
        setAccessToken(res.data.accessToken);
        if (res.data.refreshToken) {
          localStorage.setItem('refreshToken', res.data.refreshToken);
        }
        const charId = parseJwtSub(res.data.accessToken);
        navigate(charId ? `/pilots/${charId}` : '/', { replace: true });
      })
      .catch(err => {
        console.error('[AuthCallback] error', err?.response?.status, err?.response?.data ?? err?.message);
        navigate('/', { replace: true });
      });
  }, []);

  return <div className="page" style={{ textAlign: 'center', paddingTop: 80 }}>Authenticating…</div>;
}
