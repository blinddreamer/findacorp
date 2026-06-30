import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getAccessTokenExp, refreshAccessToken, clearAccessToken } from '../auth/useAuth';
import { SESSION_IDLE_MINUTES, SESSION_WARNING_SECONDS } from '../config';
import Btn from './Btn';

const IDLE_MS = SESSION_IDLE_MINUTES * 60_000;
const WARNING_MS = SESSION_WARNING_SECONDS * 1000;
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'wheel'];

/**
 * Keeps a logged-in pilot's session alive while they're active and warns before an
 * idle logout. Three jobs:
 *  - silently refresh the access token shortly before it expires (so API calls keep working);
 *  - restore a session on load when the access token expired but a refresh token remains;
 *  - after SESSION_IDLE_MINUTES of inactivity, show a countdown to log out (Stay / Log out),
 *    auto-logging-out and redirecting home if there's no response.
 */
export default function SessionGuard() {
  const auth = useAuth();
  const navigate = useNavigate();
  const loggedIn = !!auth.token;

  const lastActivity = useRef(Date.now());
  const [warnRemaining, setWarnRemaining] = useState<number | null>(null);
  const warningActive = warnRemaining != null;

  // Mirror warningActive into a ref so the (stable) activity listener reads the latest value.
  const warningActiveRef = useRef(false);
  useEffect(() => { warningActiveRef.current = warningActive; }, [warningActive]);

  const logout = useCallback(() => {
    setWarnRemaining(null);
    clearAccessToken();
    navigate('/', { replace: true });
  }, [navigate]);

  const stay = useCallback(() => {
    lastActivity.current = Date.now();
    setWarnRemaining(null);
    refreshAccessToken();
  }, []);

  // On load, restore an expired session if a refresh token is still around.
  useEffect(() => {
    if (!auth.token && localStorage.getItem('refreshToken')) refreshAccessToken();
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Idle tracking + warning countdown (only while logged in).
  useEffect(() => {
    if (!loggedIn) { setWarnRemaining(null); return; }
    lastActivity.current = Date.now();

    const onActivity = () => {
      // While the warning is up, ignore passive activity — require an explicit choice.
      if (!warningActiveRef.current) lastActivity.current = Date.now();
    };
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - lastActivity.current;
      if (elapsed >= IDLE_MS) logout();
      else if (elapsed >= IDLE_MS - WARNING_MS) setWarnRemaining(Math.ceil((IDLE_MS - elapsed) / 1000));
      else setWarnRemaining(null);
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(interval);
    };
  }, [loggedIn, logout]);

  // Proactively refresh the access token ~1 min before it expires. Re-runs whenever the
  // token changes (i.e. after each refresh), scheduling the next one.
  useEffect(() => {
    if (!loggedIn) return;
    const exp = getAccessTokenExp();
    if (exp == null) return;
    const delay = Math.max(exp * 1000 - 60_000 - Date.now(), 0);
    const t = window.setTimeout(() => { refreshAccessToken(); }, delay);
    return () => clearTimeout(t);
  }, [loggedIn, auth.token]);

  if (!warningActive) return null;

  return (
    <div className="modal-shade" style={{ zIndex: 1000 }}>
      <div className="modal" style={{ width: 420, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        <div className="eyebrow accent" style={{ justifyContent: 'center' }}>// session expiring</div>
        <h2 style={{ marginTop: 10, fontSize: 20 }}>Still there?</h2>
        <p className="muted" style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.6 }}>
          You've been inactive for a while. You'll be logged out in{' '}
          <span className="mono" style={{ color: 'var(--accent-text)' }}>{warnRemaining}s</span>.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 20 }}>
          <Btn ghost onClick={logout}>Log out</Btn>
          <Btn primary onClick={stay}>Stay logged in</Btn>
        </div>
      </div>
    </div>
  );
}
