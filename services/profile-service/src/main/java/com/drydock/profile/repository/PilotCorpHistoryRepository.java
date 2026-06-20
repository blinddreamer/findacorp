package com.drydock.profile.repository;

import com.drydock.profile.domain.PilotCorpHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PilotCorpHistoryRepository extends JpaRepository<PilotCorpHistory, Long> {

    List<PilotCorpHistory> findByCharacterIdOrderByFromDateDesc(Long characterId);

    @Modifying
    @Query("DELETE FROM PilotCorpHistory h WHERE h.characterId = :characterId")
    void deleteByCharacterId(@Param("characterId") Long characterId);
}
