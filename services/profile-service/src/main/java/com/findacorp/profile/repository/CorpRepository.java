package com.findacorp.profile.repository;

import com.findacorp.profile.domain.Corp;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CorpRepository extends JpaRepository<Corp, Long> {

    List<Corp> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    /**
     * DB-side filtered + paged corp search. Content uses JSON_OVERLAPS; tz and min_sp filter
     * the denormalized columns (kept current by upsertCorp / the backfill). filterTz=0 disables
     * the TZ IN-list. The LEFT JOIN to corp_enriched is only for sorting by members/efficiency.
     */
    @Query(value = """
        SELECT c.* FROM corps c
        LEFT JOIN corp_enriched ce ON ce.corp_id = c.corp_id
        WHERE c.status IN (:statuses)
          AND (:contentJson IS NULL OR JSON_OVERLAPS(c.content, :contentJson))
          AND (:filterTz = 0 OR c.tz IN (:tzList))
          AND (:maxMinSp IS NULL OR c.min_sp IS NULL OR c.min_sp <= :maxMinSp)
        ORDER BY
          CASE WHEN :sort = 'efficiency' THEN ce.efficiency END DESC,
          ce.members DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM corps c
        WHERE c.status IN (:statuses)
          AND (:contentJson IS NULL OR JSON_OVERLAPS(c.content, :contentJson))
          AND (:filterTz = 0 OR c.tz IN (:tzList))
          AND (:maxMinSp IS NULL OR c.min_sp IS NULL OR c.min_sp <= :maxMinSp)
        """,
        nativeQuery = true)
    Page<Corp> search(
        @Param("statuses") List<String> statuses,
        @Param("contentJson") String contentJson,
        @Param("filterTz") int filterTz,
        @Param("tzList") List<String> tzList,
        @Param("maxMinSp") Long maxMinSp,
        @Param("sort") String sort,
        Pageable pageable);
}
