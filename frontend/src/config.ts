// Corp permission feature flag (UI side).
//   false = dev mode: any logged-in user may edit listings and use HR tools
//   true  = prod mode: a corp's CEO or appointed HR only
//
// Keep in sync with the backend `app.corp-edit-restricted` property — the backend
// enforces this independently; flipping it here only changes what the UI shows.
export const CORP_EDIT_RESTRICTED = true;

// ── Session / idle timeout ────────────────────────────────────────────────────
// How long a logged-in user may stay inactive before being warned and logged out.
// The timer resets on any activity (mouse, keyboard, scroll), so active users are
// never logged out. Adjust to taste.
export const SESSION_IDLE_MINUTES = 120;
// How long the "you're about to be logged out" warning counts down before the
// session is ended automatically (and the user redirected home).
export const SESSION_WARNING_SECONDS = 60;
