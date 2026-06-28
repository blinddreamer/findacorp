package com.findacorp.profile.service;

import com.findacorp.common.events.PilotEnrichedEvent;
import com.findacorp.profile.domain.*;
import com.findacorp.profile.dto.PilotProfileResponse;
import com.findacorp.profile.dto.UpdatePilotRequest;
import com.findacorp.profile.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PilotService {

    private final PilotRepository pilotRepository;
    private final PilotEnrichedRepository pilotEnrichedRepository;
    private final PilotSkillRepository pilotSkillRepository;
    private final PilotKillHistoryRepository killHistoryRepository;
    private final PilotCorpHistoryRepository corpHistoryRepository;

    public PilotProfileResponse getProfile(Long characterId, Long requesterId) {
        Pilot pilot = pilotRepository.findById(characterId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Pilot not found"));

        // Private profiles are visible only to their owner; everyone else gets a 404 so a
        // private profile is indistinguishable from a non-existent one.
        if (Boolean.FALSE.equals(pilot.getIsPublic()) && !characterId.equals(requesterId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Pilot not found");
        }

        PilotEnriched enriched = pilotEnrichedRepository.findById(characterId).orElse(null);
        List<PilotSkill> skills = pilotSkillRepository.findByCharacterId(characterId);
        List<PilotKillHistory> kills = killHistoryRepository.findByCharacterId(characterId);
        List<PilotCorpHistory> history = corpHistoryRepository.findByCharacterIdOrderByFromDateDesc(characterId);

        return PilotProfileResponse.from(pilot, enriched, skills, kills, history);
    }

    @Transactional
    public PilotProfileResponse upsertPilot(Long characterId, String characterName,
                                             UpdatePilotRequest req) {
        Pilot pilot = pilotRepository.findById(characterId)
            .orElseGet(() -> {
                Pilot p = new Pilot();
                p.setCharacterId(characterId);
                return p;
            });

        if (characterName != null && !characterName.isBlank()
                && (pilot.getName() == null || pilot.getName().isBlank())) {
            pilot.setName(characterName);
        }
        if (req.bio() != null) pilot.setBio(req.bio());
        if (req.lookingFor() != null) pilot.setLookingFor(req.lookingFor());
        if (req.roles() != null) pilot.setRoles(req.roles());
        if (req.content() != null) pilot.setContent(req.content());
        if (req.activity() != null) pilot.setActivity(req.activity());
        if (req.voice() != null) pilot.setVoice(req.voice());
        if (req.manualTzActive() != null) pilot.setManualTzActive(req.manualTzActive());
        if (req.languages() != null) pilot.setLanguages(req.languages());
        if (req.isPublic() != null) pilot.setIsPublic(req.isPublic());

        pilot = pilotRepository.save(pilot);

        PilotEnriched enriched = pilotEnrichedRepository.findById(characterId).orElse(null);
        List<PilotSkill> skills = pilotSkillRepository.findByCharacterId(characterId);
        List<PilotKillHistory> kills = killHistoryRepository.findByCharacterId(characterId);
        List<PilotCorpHistory> history = corpHistoryRepository.findByCharacterIdOrderByFromDateDesc(characterId);

        return PilotProfileResponse.from(pilot, enriched, skills, kills, history);
    }

    @Transactional
    public void deletePilot(Long characterId) {
        killHistoryRepository.deleteByCharacterId(characterId);
        corpHistoryRepository.deleteByCharacterId(characterId);
        pilotSkillRepository.deleteByCharacterId(characterId);
        pilotEnrichedRepository.deleteById(characterId);
        pilotRepository.deleteById(characterId);
    }

    @Transactional
    public void upsertEnrichment(PilotEnrichedEvent event) {
        // Refresh the pilot's name from ESI so renames propagate (skip the "Unknown" fallback)
        if (event.name() != null && !event.name().isBlank() && !"Unknown".equals(event.name())) {
            pilotRepository.findById(event.characterId()).ifPresent(pilot -> {
                if (!event.name().equals(pilot.getName())) {
                    pilot.setName(event.name());
                    pilotRepository.save(pilot);
                }
            });
        }

        PilotEnriched enriched = pilotEnrichedRepository.findById(event.characterId())
            .orElseGet(() -> {
                PilotEnriched e = new PilotEnriched();
                e.setCharacterId(event.characterId());
                return e;
            });

        enriched.setSp(event.sp());
        enriched.setSpByCat(event.spByCat());
        enriched.setTz(event.tz());
        enriched.setTzActive(event.tzActive());
        enriched.setTzPeak(event.tzPeak());
        enriched.setLang(event.lang());
        enriched.setKbKills(event.kbKills());
        enriched.setKbLosses(event.kbLosses());
        enriched.setSoloKills(event.soloKills());
        enriched.setKbEfficiency(event.kbEfficiency() != null
            ? BigDecimal.valueOf(event.kbEfficiency()) : null);
        enriched.setIskDestroyed(event.iskDestroyed());
        enriched.setIskLost(event.iskLost());
        enriched.setHeatmap(event.heatmap());
        // skill queue: store as "SkillName:level" strings
        if (event.skillQueue() != null) {
            enriched.setSkillQueue(event.skillQueue().stream()
                .map(s -> s.skillName() + ":" + s.level())
                .toList());
        }
        enriched.setTitle(event.title());
        enriched.setEveBio(event.eveBio());
        enriched.setLastSyncedAt(toLocalDateTime(event.syncedAt()));
        pilotEnrichedRepository.save(enriched);

        if (event.skills() != null && !event.skills().isEmpty()) {
            List<String> incomingNames = event.skills().stream()
                .map(com.findacorp.common.dto.SkillDto::skillName).toList();
            pilotSkillRepository.deleteByCharacterIdAndSkillNameNotIn(event.characterId(), incomingNames);

            Map<String, PilotSkill> existing = pilotSkillRepository
                .findByCharacterId(event.characterId()).stream()
                .collect(java.util.stream.Collectors.toMap(PilotSkill::getSkillName, s -> s));

            LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
            List<PilotSkill> toSave = new ArrayList<>();
            for (com.findacorp.common.dto.SkillDto s : event.skills()) {
                PilotSkill ps = existing.get(s.skillName());
                if (ps == null) {
                    ps = new PilotSkill(event.characterId(), s.skillName(), s.level(), s.points());
                    ps.setLearnedAt(now);
                } else {
                    if (s.level() > ps.getLevel()) ps.setLearnedAt(now);
                    ps.setLevel((byte) s.level());
                    ps.setPoints(s.points());
                }
                if (s.category() != null) ps.setCategory(s.category());
                toSave.add(ps);
            }
            pilotSkillRepository.saveAll(toSave);
        } else {
            pilotSkillRepository.deleteByCharacterId(event.characterId());
        }

        killHistoryRepository.deleteByCharacterId(event.characterId());
        if (event.killHistory() != null) {
            killHistoryRepository.saveAll(event.killHistory().stream()
                .map(k -> new PilotKillHistory(
                    event.characterId(), k.kind(), k.ship(), k.shipTypeId(), k.system(), k.isk(),
                    toLocalDateTime(k.whenAt()), k.finalBlow(), k.victimName()))
                .toList());
        }

        corpHistoryRepository.deleteByCharacterId(event.characterId());
        if (event.corpHistory() != null) {
            corpHistoryRepository.saveAll(event.corpHistory().stream()
                .map(h -> new PilotCorpHistory(
                    event.characterId(), h.corpId(), h.corpName(), h.alliance(),
                    h.fromDate(), h.toDate(), h.durationLabel()))
                .toList());
        }
    }

    private LocalDateTime toLocalDateTime(Instant instant) {
        return instant != null ? LocalDateTime.ofInstant(instant, ZoneOffset.UTC) : null;
    }
}
