# FINDACORP (DRYDOCK) — guide for Claude

FINDACORP is a third-party **EVE Online** recruitment platform: pilots get a data-driven
profile built from ESI + zKillboard, corps get a listing, an applicant inbox, and HR search.
It's a Spring Boot **microservices monorepo** (Java 21) behind Eureka + Spring Cloud Gateway,
with a React + Vite SPA served by nginx. *DRYDOCK* is the internal codename.

**Read [`README.md`](README.md) for the full architecture, service table, data flow, and config.**
This file is the working contract: how to build/test here, the standards to hold, and the
traps that have already bitten us. Don't restate the README — trust it and link to it.

---

## Repository layout

```
common/        shared DTOs + RabbitMQ event/constant definitions (library, no image)
services/      eureka-server, api-gateway, auth-service, profile-service,
               data-collector, application-service  (each a standalone Spring Boot app)
frontend/      React 19 + TypeScript + Vite SPA (nginx in prod)
Dockerfile     shared thin runtime image for backend services (--build-arg SERVICE=<name>)
pom.xml        Maven multi-module parent
.github/workflows/docker-images.yml   change-scoped CI: builds+pushes per-service images
```

---

## Build, run, test

### Backend (Java 21 — this matters)

- **Targets Java 21. JDK 25 breaks Lombok 1.18.34** (`TypeTag :: UNKNOWN` at compile). If a
  build fails with a Lombok/javac error, check `JAVA_HOME` points at a 21.x JDK first.
- Maven 3.9+. `common` is a dependency of every service, so build with `-am` (also-make).

```bash
mvn -DskipTests clean package                 # whole stack
mvn -pl services/<svc> -am compile            # one service + common
mvn -pl services/<svc> -am test               # test one service
mvn test                                       # all tests
```

### Frontend

```bash
cd frontend
npm install            # NOT npm ci — see gotcha below
npm run dev            # Vite dev server on :3000, proxies /api/** to :8080
npm run build          # tsc -b && vite build  (type errors fail the build)
npm test               # Vitest
npm run lint           # ESLint
```

**Before calling frontend work done, run `npx tsc -b --noEmit` and `npm run lint`** — the
production build runs `tsc -b`, so a type error that `vite dev` tolerated will break CI.

---

## Coding standards (enforced — the user asked for these explicitly)

Apply these to **all** generated/modified code, backend and frontend:

1. **SOLID + framework best practices.** Single responsibility, small units, depend on
   abstractions, keep pure logic separable and testable.
2. **No duplication.** If logic exists elsewhere, reuse it. (E.g. TZ-inference and the
   `MAX_HR` cap are intentionally kept in sync across frontend and backend — don't fork them.)
3. **Unit-test non-trivial logic, and run the tests green before finishing.**
   - Backend: **JUnit 5 + Mockito + AssertJ** (`spring-boot-starter-test`).
   - Frontend: **Vitest** (pure util/logic modules — see `src/utils/*.test.ts`).
   - Writing the test frequently surfaces the real bug; treat it as part of the change, not
     an afterthought.
4. **Match the surrounding code** — its naming, comment density, and idioms. Explain *why* in
   comments, not *what*.

---

## Backend conventions

- **Spring stack:** Eureka discovery, Spring Cloud Gateway, **OpenFeign** for inter-service
  HTTP, Lombok, MapStruct, Jackson, jjwt.
- **Auth flow:** only `auth-service` talks to EVE SSO. The **gateway validates the JWT** and
  forwards `X-Character-Id` / `X-Character-Name` headers downstream; services trust those
  headers, they don't re-validate tokens. OAuth authorize redirects must be `no-store`
  (single-use `state` + PKCE challenge).
- **External calls are resilient by default:** Resilience4j circuit breakers on ESI, a
  1 req/sec rate limiter on zKillboard. New external integrations should follow suit.
- **Async enrichment:** `data-collector` publishes `PilotEnrichedEvent` / `CorpEnrichedEvent`
  (defined in `common`) to the `drydock.enrichment` exchange; `profile-service` consumes and
  upserts (manual ACK, prefetch=1). Keep event DTOs in `common`, shared by producer + consumer.
- **Schema management differs per service:** `application-service` uses **Flyway**
  (`ddl-auto=validate`); `profile-service` uses `schema.sql` (Flyway disabled). Add migrations
  the way the service you're touching already does it.
- **Config comes from env vars** (`application-local.yml` holds dev defaults). Never hardcode
  secrets, hosts, or keys — `JWT_SECRET`, `TOKEN_ENCRYPTION_KEY`, `EVE_CLIENT_ID/SECRET`, DB and
  RabbitMQ vars.

## Frontend conventions

- **React 19 + TypeScript, function components.** Data fetching via **TanStack Query**
  (`useQuery`/`useMutation` with `queryKey`s); HTTP via the shared Axios client
  (`src/api/*Api.ts`), whose `baseURL` is `/api` — never hardcode full backend URLs.
- **Routing:** React Router v7. Client routes (`/search/corps`, `/inbox`, …) are separate from
  the `/api/**` backend namespace on purpose.
- **Big lists must not render unbounded.** Roster/member lists can be thousands of entries —
  filter + cap the rendered rows (see the HR picker in `screens/corp/CorpOverview.tsx`), don't
  map the whole array into the DOM.
- Styling is mostly inline `style={{…}}` with CSS custom properties (`var(--accent)` etc.);
  follow the existing pattern rather than introducing a new styling system.

---

## Domain context (EVE Online)

Always reason in EVE terms: **pilots** (characters), **corporations**, **alliances**,
**killmails**, **ESI** (CCP's official API), **zKillboard** (kill/loss data), **EVE Who**
(public corp roster — observed data, can be incomplete/laggy). A corp's editors are its
**CEO** plus up to **2 appointed HR** (`MAX_HR`, mirrored in `utils/hr.ts` and the backend).

---

## Gotchas that have bitten us

- **JDK 21, not 25** (Lombok) — see above.
- **Frontend Dockerfile uses `npm install`, not `npm ci`, and copies `package*.json`** so the
  lockfile is optional. A `package-lock.json` generated on Windows omits the Linux/musl WASM
  optional deps (e.g. `@emnapi/runtime`) the `node:22-alpine` build needs, which makes `npm ci`
  fail its sync check. Don't "helpfully" switch it back to `npm ci` unless you also commit a
  **Linux-generated** lockfile.
- **CI is change-scoped:** editing `common/**`, the parent `pom.xml`, or the shared `Dockerfile`
  rebuilds *all* services; `services/<svc>/**` rebuilds one; `frontend/**` rebuilds the SPA.
- Portainer redeploy jobs run on a **self-hosted** runner (the webhook is only reachable inside
  the deploy network); everything else builds on GitHub-hosted runners.

---

## Git & workflow

- Push to `main`/`master` (or a `v*` tag) triggers the image build. The team commits directly
  to `master`; **only commit or push when asked.**
- Keep changes minimal and scoped; don't bundle unrelated edits into one commit.