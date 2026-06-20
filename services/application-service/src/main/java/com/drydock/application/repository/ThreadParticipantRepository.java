package com.drydock.application.repository;

import com.drydock.application.domain.ThreadParticipant;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ThreadParticipantRepository extends JpaRepository<ThreadParticipant, Long> {

    List<ThreadParticipant> findByCharacterId(Long characterId);

    List<ThreadParticipant> findByThreadId(Long threadId);

    Optional<ThreadParticipant> findByThreadIdAndCharacterId(Long threadId, Long characterId);
}
