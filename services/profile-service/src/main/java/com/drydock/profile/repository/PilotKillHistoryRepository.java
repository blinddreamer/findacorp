package com.drydock.profile.repository;

import com.drydock.profile.domain.PilotKillHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PilotKillHistoryRepository extends JpaRepository<PilotKillHistory, Long> {

    List<PilotKillHistory> findByCharacterId(Long characterId);

    @Modifying
    @Query("DELETE FROM PilotKillHistory k WHERE k.characterId = :characterId")
    void deleteByCharacterId(@Param("characterId") Long characterId);
}
