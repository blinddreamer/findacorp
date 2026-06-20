package com.drydock.collector.repository;

import com.drydock.collector.domain.EntityType;
import com.drydock.collector.domain.SyncTarget;
import com.drydock.collector.domain.SyncTargetId;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface SyncTargetRepository extends JpaRepository<SyncTarget, SyncTargetId> {

    @Query("SELECT s FROM SyncTarget s WHERE s.id.entityType = :type AND s.nextSyncAt <= :now ORDER BY s.nextSyncAt ASC")
    List<SyncTarget> findDueTargets(@Param("type") EntityType type,
                                    @Param("now") LocalDateTime now,
                                    Pageable pageable);
}
