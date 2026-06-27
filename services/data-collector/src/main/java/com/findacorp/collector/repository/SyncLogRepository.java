package com.findacorp.collector.repository;

import com.findacorp.collector.domain.SyncLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SyncLogRepository extends JpaRepository<SyncLog, Long> {
}
