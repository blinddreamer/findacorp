# ── Stage 1: build the Vite SPA ───────────────────────────────────────────────
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
# Not `npm ci`: the lockfile is generated on Windows and omits the Linux/musl
# WASM optional deps (e.g. @emnapi/runtime) this Alpine image needs, so `npm ci`
# fails its strict in-sync check. `npm install` reconciles the missing platform
# deps at build time from the same lockfile.
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build

# ── Stage 2: serve static files via nginx, proxying API calls to the gateway ──
FROM nginx:1.27-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
# Where the api-gateway is reachable from this container; override at deploy time.
ENV GATEWAY_URL=http://api-gateway:8080
EXPOSE 80
