# Spec — Push search filtering & pagination into the database

## Problem

`SearchService.searchPilots` / `searchCorps` currently:

1. Run a DB query that only filters the **scalar/column** predicates.
2. Load **all** matching rows into memory.
3. Filter the **JSON-array** and **derived** predicates in Java (`anyMatch`, `inferTz`, `parseMinSp`).
4. Paginate with `subList`, then map (enrichment is batch-fetched per page — N+1 already fixed).

This doesn't scale (whole result set in memory) and the `Page.totalElements` count is computed from the in-memory list rather than the DB.

### Why it isn't already in SQL

| Filter | Storage | Today |
|---|---|---|
| pilot tz / minSp / minEff / activity | scalar columns (`pilot_enriched.tz/sp/kb_efficiency`, `pilots.activity`) | in query ✅ |
| pilot **roles** / **content** | JSON arrays on `pilots` | in memory |
| corp **status** | enum column | in query ✅ |
| corp **content** | JSON array on `corps` | in memory |
| corp **tz** | *derived* from `corps.tz_hours` (JSON) via `inferTz` | in memory |
| corp **minSp** | *derived* from `corps.requirements` (JSON) via `parseMinSp` | in memory |

## Environment (verified 2026-06-14)

- **MariaDB 12.0.2** at `172.30.95.20:3306` (reachable). Supports `JSON_OVERLAPS`, `JSON_CONTAINS`.
- profile-service schema is managed by `db/schema.sql` (Flyway disabled).
- `StringListConverter` / `IntegerListConverter` already persist `List` fields as **JSON arrays** — so JSON functions apply directly.

## Approach

Two techniques, by filter category:

1. **JSON multi-select filters → `JSON_OVERLAPS`** (no schema change).
   `JSON_OVERLAPS(p.roles, '["Logi","DPS"]')` → true if any selected value is present. Applies to pilot `roles`/`content` and corp `content`.
2. **Derived corp filters (tz, minSp) → denormalized columns** computed at write time.
   Add `corps.tz` and `corps.min_sp`, populated in `CorpService.upsertCorp` using the existing `CorpSearchResult.inferTz` / `parseMinSp`. Then filter `corps.tz IN (...)` and `corps.min_sp <= ?`.

Then repositories return `Page<T>` with `Pageable` (SQL `LIMIT/OFFSET` + a `countQuery`), and `SearchService` drops all in-memory filtering/paging.

---

## Work items

### 1. Schema — denormalize corp derived values

`services/profile-service/src/main/resources/db/schema.sql` (add to the incremental `ALTER` block; idempotent):

```sql
ALTER TABLE corps ADD COLUMN IF NOT EXISTS tz     VARCHAR(5);
ALTER TABLE corps ADD COLUMN IF NOT EXISTS min_sp BIGINT;
CREATE INDEX IF NOT EXISTS idx_corps_status ON corps (status);
CREATE INDEX IF NOT EXISTS idx_corps_tz     ON corps (tz);
CREATE INDEX IF NOT EXISTS idx_pe_sp        ON pilot_enriched (sp);
CREATE INDEX IF NOT EXISTS idx_pe_tz        ON pilot_enriched (tz);
```

### 2. Domain + write path

- `Corp` entity: add `String tz`, `Long minSp` (`@Column(name = "min_sp")`).
- `CorpService.upsertCorp`: after applying `tzHours` / `requirements`, recompute:
  ```java
  corp.setTz(CorpSearchResult.inferTz(corp.getTzHours()));
  corp.setMinSp(CorpSearchResult.parseMinSp(corp.getRequirements()));
  ```
  (Move `inferTz`/`parseMinSp` to a `CorpDerived` util so a DTO isn't the home of write-path logic — optional cleanup.)
- **Backfill** existing rows once (the values derive from JSON that SQL can't parse). Add a guarded `ApplicationRunner` (or a `@PostConstruct` one-shot) that loads all corps where `tz IS NULL`, recomputes, and saves. Safe to run every boot since it only touches rows missing the derived values.

### 3. Repository queries (native, paged, JSON-aware)

`PilotRepository` — replace the current method:

```java
@Query(value = """
    SELECT p.* FROM pilots p
    JOIN pilot_enriched pe ON pe.character_id = p.character_id
    WHERE (:filterTz = FALSE OR pe.tz IN (:tzList))
      AND (:minSp  IS NULL OR pe.sp >= :minSp)
      AND (:minEff IS NULL OR pe.kb_efficiency >= :minEff)
      AND (:activity IS NULL OR p.activity = :activity)
      AND (:rolesJson   IS NULL OR JSON_OVERLAPS(p.roles,   :rolesJson))
      AND (:contentJson IS NULL OR JSON_OVERLAPS(p.content, :contentJson))
    """,
    countQuery = """
    SELECT COUNT(*) FROM pilots p
    JOIN pilot_enriched pe ON pe.character_id = p.character_id
    WHERE (:filterTz = FALSE OR pe.tz IN (:tzList))
      AND (:minSp  IS NULL OR pe.sp >= :minSp)
      AND (:minEff IS NULL OR pe.kb_efficiency >= :minEff)
      AND (:activity IS NULL OR p.activity = :activity)
      AND (:rolesJson   IS NULL OR JSON_OVERLAPS(p.roles,   :rolesJson))
      AND (:contentJson IS NULL OR JSON_OVERLAPS(p.content, :contentJson))
    """,
    nativeQuery = true)
Page<Pilot> search(@Param("filterTz") boolean filterTz,
                   @Param("tzList") List<String> tzList,
                   @Param("minSp") Long minSp,
                   @Param("minEff") Double minEff,
                   @Param("activity") String activity,
                   @Param("rolesJson") String rolesJson,
                   @Param("contentJson") String contentJson,
                   Pageable pageable);
```

`CorpRepository` — after denormalization:

```java
@Query(value = """
    SELECT c.* FROM corps c
    WHERE c.status IN (:statuses)
      AND (:contentJson IS NULL OR JSON_OVERLAPS(c.content, :contentJson))
      AND (:filterTz = FALSE OR c.tz IN (:tzList))
      AND (:maxMinSp IS NULL OR c.min_sp IS NULL OR c.min_sp <= :maxMinSp)
    """,
    countQuery = "... same WHERE ...",
    nativeQuery = true)
Page<Corp> search(@Param("statuses") List<String> statuses,
                  @Param("contentJson") String contentJson,
                  @Param("filterTz") boolean filterTz,
                  @Param("tzList") List<String> tzList,
                  @Param("maxMinSp") Long maxMinSp,
                  Pageable pageable);
```

Notes:
- **Empty `IN` lists**: keep the existing sentinel trick — when not filtering, pass `filterTz = false` and `tzList = List.of("__none__")` (and for statuses, always pass the full set).
- **Sort**: pass it via `Pageable`'s `Sort` (`PageRequest.of(page, size, Sort.by(...))`) and whitelist sortable columns in the controller, instead of the `CASE WHEN :sort` hack. Spring appends `ORDER BY` to native queries from the `Pageable`.
- **JSON params**: serialize the selected values to a JSON array string with Jackson (`["Logi","DPS"]`); pass `null` when nothing is selected so the `IS NULL` branch short-circuits.

### 4. SearchService — collapse to pass-through

```java
public Page<PilotSearchResult> searchPilots(...) {
    boolean filterTz = tz != null && !tz.isEmpty();
    List<String> tzList = filterTz ? tz : List.of("__none__");
    String rolesJson   = toJsonArrayOrNull(roles);
    String contentJson = toJsonArrayOrNull(content);
    Page<Pilot> page = pilotRepository.search(filterTz, tzList, minSp, minEff, activity,
                                              rolesJson, contentJson, pageable);
    Map<Long, PilotEnriched> enriched = batchEnriched(page.getContent());   // existing helper
    return page.map(p -> PilotSearchResult.from(p, enriched.get(p.getCharacterId())));
}
```

`Page.map(...)` preserves `totalElements`/paging from the DB. The in-memory `filter`/`subList`/`PageImpl` all go away.

### 5. Tests — Testcontainers MariaDB

The JSON functions are MariaDB-specific (H2 won't do `JSON_OVERLAPS`), so use Testcontainers:

- Add test deps: `org.testcontainers:junit-jupiter`, `org.testcontainers:mariadb`.
- `@DataJpaTest @AutoConfigureTestDatabase(replace = NONE) @Testcontainers`, a `@Container MariaDBContainer<>("mariadb:12")`, `@DynamicPropertySource` wiring the datasource, and `spring.sql.init` running `schema.sql` against it.
- Repository tests: insert pilots/corps + enriched fixtures, then assert:
  - role/content multi-select via `JSON_OVERLAPS` (incl. the "≥2 selected" case),
  - corp tz / `min_sp` column filters,
  - **pagination**: page size, `totalElements`, offset correctness,
  - the empty-filter sentinel path returns everything.

Keep the existing Mockito `SearchServiceTest` for the service's param-building/mapping; the Testcontainers tests cover the SQL.

---

## Rollout order

1. Schema columns + indexes + backfill runner.
2. `Corp.tz/minSp` + compute in `upsertCorp`.
3. Repo native paged queries (`JSON_OVERLAPS`, `countQuery`, `Pageable` sort).
4. Simplify `SearchService` to pass-through + `Page.map`.
5. Testcontainers repository tests.
6. Verify against the dev DB (now reachable) and sanity-check `totalElements` on the search screens.

## Risks / call-outs

- **Backfill** must be a Java task (SQL can't parse `"Minimum SP: 25M"`); until it runs, corp tz/minSp filters skip un-backfilled rows.
- **Dynamic sort** in native queries: whitelist columns to avoid SQL injection via the `sort` param.
- **JSON validity**: `JSON_OVERLAPS` errors on non-JSON; all list columns are written as JSON arrays by the converters, but guard `NULL`/empty (a never-set column may be SQL `NULL` → the `IS NULL` arg branch already handles "no filter", and `JSON_OVERLAPS(NULL, ...)` yields `NULL`/false which correctly excludes).
- **Indexing JSON**: if role/content filtering becomes hot, add MariaDB generated columns + indexes; not needed initially.
