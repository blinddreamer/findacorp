// Corp permission feature flag (UI side).
//   false = dev mode: any logged-in user may edit listings and use HR tools
//   true  = prod mode: a corp's CEO or appointed HR only
//
// Keep in sync with the backend `app.corp-edit-restricted` property — the backend
// enforces this independently; flipping it here only changes what the UI shows.
export const CORP_EDIT_RESTRICTED = true;
