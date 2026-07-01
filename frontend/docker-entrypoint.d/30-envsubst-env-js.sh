#!/bin/sh
# Substitute the container's environment variables into the SPA's runtime config.
# Runs at container start via the nginx image's /docker-entrypoint.d/ mechanism,
# before nginx launches. Unset variables become empty strings, which config.ts
# treats as "use the built-in default".
set -e

target=/usr/share/nginx/html/env.js
[ -f "$target" ] || exit 0

vars='${CORP_EDIT_RESTRICTED} ${SESSION_IDLE_MINUTES} ${SESSION_WARNING_SECONDS} ${EVE_MAIL_ENABLED}'
tmp="$(mktemp)"
envsubst "$vars" < "$target" > "$tmp"
cat "$tmp" > "$target"
rm -f "$tmp"
