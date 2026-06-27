package com.findacorp.profile.repository;

import com.findacorp.profile.domain.CorpAllianceHistory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorpAllianceHistoryRepository extends JpaRepository<CorpAllianceHistory, Long> {
    List<CorpAllianceHistory> findByCorpIdOrderByStartDateDesc(Long corpId);
    void deleteByCorpId(Long corpId);
}
