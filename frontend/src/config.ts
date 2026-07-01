// Application configuration.
//
// Every value can be overridden at runtime by an environment variable on the
// frontend container: `env.js` (see public/env.js) is `envsubst`-ed at container
// startup into `window.__ENV__`, and read here. When a value is unset — or in
// `vite dev`, where the ${...} placeholders are never substituted — the built-in
// default below applies.
//
// Backend flags (CORP_EDIT_RESTRICTED, EVE_MAIL_ENABLED) must be kept in sync with
// the matching backend properties; the backend enforces them independently.

declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

const runtimeEnv: Record<string, string> =
  (typeof window !== 'undefined' && window.__ENV__) || {};

/** True when a raw env value is missing or an unsubstituted `${...}` placeholder. */
function isUnset(v: string | undefined): boolean {
  return v == null || v === '' || v.startsWith('${');
}

function envBool(key: string, fallback: boolean): boolean {
  const v = runtimeEnv[key];
  if (isUnset(v)) return fallback;
  return v === 'true' || v === '1';
}

function envNum(key: string, fallback: number): number {
  const v = runtimeEnv[key];
  if (isUnset(v)) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// Corp permission feature flag (UI side).
//   false = dev mode: any logged-in user may edit listings and use HR tools
//   true  = prod mode: a corp's CEO or appointed HR only
// Env var: CORP_EDIT_RESTRICTED ("true"/"false"). Mirrors backend `app.corp-edit-restricted`.
export const CORP_EDIT_RESTRICTED = envBool('CORP_EDIT_RESTRICTED', true);

// ── Session / idle timeout ────────────────────────────────────────────────────
// How long a logged-in user may stay inactive before being warned and logged out.
// The timer resets on any activity (mouse, keyboard, scroll), so active users are
// never logged out. Env var: SESSION_IDLE_MINUTES.
export const SESSION_IDLE_MINUTES = envNum('SESSION_IDLE_MINUTES', 120);
// How long the "you're about to be logged out" warning counts down before the
// session is ended automatically (and the user redirected home). Env var: SESSION_WARNING_SECONDS.
export const SESSION_WARNING_SECONDS = envNum('SESSION_WARNING_SECONDS', 60);

// ── EVE mail feature ──────────────────────────────────────────────────────────
// Toggles the "Send EVEmail" feature (sending a real in-game mail via EVE SSO).
//   true  = show the Send EVEmail button
//   false = feature off: the button is hidden everywhere
// Env var: EVE_MAIL_ENABLED ("true"/"false"). Mirrors backend `app.eve-mail-enabled`.
export const EVE_MAIL_ENABLED = envBool('EVE_MAIL_ENABLED', true);
