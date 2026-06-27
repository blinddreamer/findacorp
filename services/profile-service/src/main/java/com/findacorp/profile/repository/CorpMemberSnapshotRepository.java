package com.findacorp.profile.repository;

import com.findacorp.profile.domain.CorpMemberSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorpMemberSnapshotRepository extends JpaRepository<CorpMemberSnapshot, Long> {
    List<CorpMemberSnapshot> findTop60ByCorpIdOrderBySnappedAtDesc(Long corpId);
}
