package com.drydock.profile.repository;

import com.drydock.profile.domain.CorpMember;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CorpMemberRepository extends JpaRepository<CorpMember, Long> {
    List<CorpMember> findByCorpIdOrderByCharacterNameAsc(Long corpId);
    void deleteByCorpId(Long corpId);
}
