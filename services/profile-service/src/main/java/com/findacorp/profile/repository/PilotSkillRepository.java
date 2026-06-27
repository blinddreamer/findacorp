package com.findacorp.profile.repository;

import com.findacorp.profile.domain.PilotSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PilotSkillRepository extends JpaRepository<PilotSkill, Long> {

    List<PilotSkill> findByCharacterId(Long characterId);

    @Modifying
    @Query("DELETE FROM PilotSkill s WHERE s.characterId = :characterId")
    void deleteByCharacterId(@Param("characterId") Long characterId);

    @Modifying
    @Query("DELETE FROM PilotSkill s WHERE s.characterId = :characterId AND s.skillName NOT IN :names")
    void deleteByCharacterIdAndSkillNameNotIn(@Param("characterId") Long characterId,
                                              @Param("names") List<String> names);
}
