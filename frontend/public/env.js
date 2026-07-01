// Runtime configuration for the SPA.
//
// In production this file is copied into the nginx web root and `envsubst` replaces
// the ${...} placeholders with the container's environment variables at startup
// (see the Dockerfile + docker-entrypoint.d/30-envsubst-env-js.sh). That lets you
// change config with `docker run -e VAR=value …` without rebuilding the image.
//
// In `vite dev` there is no envsubst, so the ${...} placeholders are served verbatim;
// config.ts detects unsubstituted placeholders (and empty values) and falls back to
// its built-in defaults. To override in dev, edit the defaults in config.ts.
window.__ENV__ = {
  CORP_EDIT_RESTRICTED: "${CORP_EDIT_RESTRICTED}",
  SESSION_IDLE_MINUTES: "${SESSION_IDLE_MINUTES}",
  SESSION_WARNING_SECONDS: "${SESSION_WARNING_SECONDS}",
  EVE_MAIL_ENABLED: "${EVE_MAIL_ENABLED}",
};
