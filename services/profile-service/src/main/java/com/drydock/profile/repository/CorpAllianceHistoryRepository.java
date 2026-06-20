package com.drydock.profile.repository;

import com.drydock.profile.domain.CorpAllianceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorpAllianceHistoryRepository extends JpaRepository<CorpAllianceHistory, Long> {
    List<CorpAllianceHistory> findByCorpIdOrderByStartDateDesc(Long corpId);
    void deleteByCorpId(Long corpId);
}
