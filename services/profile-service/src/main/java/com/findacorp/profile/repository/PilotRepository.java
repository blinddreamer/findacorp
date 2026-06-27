package com.findacorp.profile.repository;

import com.findacorp.profile.domain.Pilot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PilotRepository extends JpaRepository<Pilot, Long> {

    List<Pilot> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    /**
     * DB-side filtered + paged pilot search. Scalar predicates run on indexed columns; the
     * JSON multi-select role/content filters use MariaDB JSON_OVERLAPS (pass a JSON array
     * string like ["Logi","DPS"], or null to disable). filterTz=0 disables the TZ IN-list.
     */
    @Query(value = """
        SELECT p.* FROM pilots p
        JOIN pilot_enriched pe ON pe.character_id = p.character_id
        WHERE (:filterTz = 0 OR pe.tz IN (:tzList))
          AND (:minSp IS NULL OR pe.sp >= :minSp)
          AND (:minEff IS NULL OR pe.kb_efficiency >= :minEff)
          AND (:activity IS NULL OR p.activity = :activity)
          AND (:rolesJson IS NULL OR JSON_OVERLAPS(p.roles, :rolesJson))
          AND (:contentJson IS NULL OR JSON_OVERLAPS(p.content, :contentJson))
        ORDER BY
          CASE WHEN :sort = 'eff' THEN pe.kb_efficiency END DESC,
          CASE WHEN :sort = 'kills' THEN pe.kb_kills END DESC,
          pe.sp DESC
        """,
        countQuery = """
        SELECT COUNT(*) FROM pilots p
        JOIN pilot_enriched pe ON pe.character_id = p.character_id
        WHERE (:filterTz = 0 OR pe.tz IN (:tzList))
          AND (:minSp IS NULL OR pe.sp >= :minSp)
          AND (:minEff IS NULL OR pe.kb_efficiency >= :minEff)
          AND (:activity IS NULL OR p.activity = :activity)
          AND (:rolesJson IS NULL OR JSON_OVERLAPS(p.roles, :rolesJson))
          AND (:contentJson IS NULL OR JSON_OVERLAPS(p.content, :contentJson))
        """,
        nativeQuery = true)
    Page<Pilot> search(
        @Param("filterTz") int filterTz,
        @Param("tzList") List<String> tzList,
        @Param("minSp") Long minSp,
        @Param("minEff") Double minEff,
        @Param("activity") String activity,
        @Param("rolesJson") String rolesJson,
        @Param("contentJson") String contentJson,
        @Param("sort") String sort,
        Pageable pageable);
}
