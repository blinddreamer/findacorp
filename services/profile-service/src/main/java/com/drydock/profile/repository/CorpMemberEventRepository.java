package com.drydock.profile.repository;

import com.drydock.profile.domain.CorpMemberEvent;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorpMemberEventRepository extends JpaRepository<CorpMemberEvent, Long> {
    List<CorpMemberEvent> findTop200ByCorpIdOrderByOccurredAtDesc(Long corpId);
}
