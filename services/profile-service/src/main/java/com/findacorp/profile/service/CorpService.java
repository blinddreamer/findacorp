package com.findacorp.profile.service;

import com.findacorp.common.events.CorpEnrichedEvent;
import com.findacorp.profile.domain.*;
import com.findacorp.profile.dto.CeoChangeNotification;
import com.findacorp.profile.dto.CorpProfileResponse;
import com.findacorp.profile.dto.UpdateCorpRequest;
import com.findacorp.profile.feign.NotificationClient;
import com.findacorp.profile.repository.*;
import com.findacorp.profile.util.CorpDerived;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CorpService {

    private final CorpRepository corpRepository;
    private final CorpEnrichedRepository corpEnrichedRepository;
    private final CorpAllianceHistoryRepository allianceHistoryRepository;
    private final CorpMemberSnapshotRepository memberSnapshotRepository;
    private final CorpMemberRepository memberRepository;
    private final CorpMemberEventRepository memberEventRepository;
    private final NotificationClient notificationClient;

    /**
     * Whether {@code characterId} may edit this corp's listing or trigger a sync:
     * true if they are the corp's CEO (from the latest sync) or an appointed HR.
     * Returns false if the corp has never synced (CEO unknown) — callers gate this
     * behind the {@code app.corp-edit-restricted} flag so dev mode stays open.
     */
    public boolean canEdit(Long corpId, Long characterId) {
        if (characterId == null) return false;
        CorpEnriched enriched = corpEnrichedRepository.findById(corpId).orElse(null);
        if (enriched != null && characterId.equals(enriched.getCeoId())) return true;
        Corp corp = corpRepository.findById(corpId).orElse(null);
        return corp != null && corp.getHrIds() != null && corp.getHrIds().contains(characterId);
    }

    /**
     * Whether the corp's CEO is known yet (i.e. it has been synced at least once).
     * Until it is, edits are left open so a CEO can bootstrap the initial listing —
     * after which {@link #canEdit} locks editing to the CEO/HR.
     */
    public boolean isCeoKnown(Long corpId) {
        return corpEnrichedRepository.findById(corpId)
                .map(e -> e.getCeoId() != null).orElse(false);
    }

    public CorpProfileResponse getProfile(Long corpId) {
        Corp corp = corpRepository.findById(corpId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Corp not found"));
        CorpEnriched enriched  = corpEnrichedRepository.findById(corpId).orElse(null);
        var allianceHistory    = allianceHistoryRepository.findByCorpIdOrderByStartDateDesc(corpId);
        var memberHistory      = memberSnapshotRepository.findTop60ByCorpIdOrderBySnappedAtDesc(corpId);
        var roster             = memberRepository.findByCorpIdOrderByCharacterNameAsc(corpId);
        var memberEvents       = memberEventRepository.findTop200ByCorpIdOrderByOccurredAtDesc(corpId);
        return CorpProfileResponse.from(corp, enriched, allianceHistory, memberHistory, roster, memberEvents);
    }

    @Transactional
    public CorpProfileResponse upsertCorp(Long corpId, UpdateCorpRequest req) {
        Corp corp = corpRepository.findById(corpId)
            .orElseGet(() -> {
                Corp c = new Corp();
                c.setCorpId(corpId);
                return c;
            });

        if (req.name() != null)         corp.setName(req.name());
        if (req.ticker() != null)       corp.setTicker(req.ticker());
        if (req.faction() != null)      corp.setFaction(req.faction());
        if (req.tagline() != null)      corp.setTagline(req.tagline());
        if (req.pitch() != null)        corp.setPitch(req.pitch());
        if (req.requirements() != null) corp.setRequirements(req.requirements());
        if (req.doctrines() != null)    corp.setDoctrines(req.doctrines());
        if (req.content() != null)      corp.setContent(req.content());
        if (req.status() != null)       corp.setStatus(req.status());
        if (req.rolesLooking() != null) corp.setRolesLooking(req.rolesLooking());
        if (req.languages() != null)    corp.setLanguages(req.languages());
        if (req.tzHours() != null)      corp.setTzHours(req.tzHours());
        if (req.hrIds() != null)        corp.setHrIds(req.hrIds());

        // Keep the denormalized, search-queryable derivations in sync with the raw fields.
        corp.setTz(CorpDerived.inferTz(corp.getTzHours()));
        corp.setMinSp(CorpDerived.parseMinSp(corp.getRequirements()));

        corp = corpRepository.save(corp);
        CorpEnriched enriched  = corpEnrichedRepository.findById(corpId).orElse(null);
        var allianceHistory    = allianceHistoryRepository.findByCorpIdOrderByStartDateDesc(corpId);
        var memberHistory      = memberSnapshotRepository.findTop60ByCorpIdOrderBySnappedAtDesc(corpId);
        var roster             = memberRepository.findByCorpIdOrderByCharacterNameAsc(corpId);
        var memberEvents       = memberEventRepository.findTop200ByCorpIdOrderByOccurredAtDesc(corpId);
        return CorpProfileResponse.from(corp, enriched, allianceHistory, memberHistory, roster, memberEvents);
    }

    @Transactional
    public void upsertEnrichment(CorpEnrichedEvent event) {
        Corp corp = corpRepository.findById(event.corpId())
            .orElseGet(() -> {
                Corp c = new Corp();
                c.setCorpId(event.corpId());
                return c;
            });
        if (event.name() != null)   corp.setName(event.name());
        if (event.ticker() != null) corp.setTicker(event.ticker());
        corpRepository.save(corp);

        LocalDateTime syncedAt = event.syncedAt() != null
            ? LocalDateTime.ofInstant(event.syncedAt(), ZoneOffset.UTC)
            : LocalDateTime.now(ZoneOffset.UTC);

        CorpEnriched enriched = corpEnrichedRepository.findById(event.corpId())
            .orElseGet(() -> {
                CorpEnriched e = new CorpEnriched();
                e.setCorpId(event.corpId());
                return e;
            });
        Long prevCeoId = enriched.getCeoId();
        enriched.setMembers(event.members());
        enriched.setCapacity(event.capacity());
        enriched.setAlliance(event.alliance());
        enriched.setFounded(event.founded());
        enriched.setKillsLast30(event.killsLast30());
        enriched.setEfficiency(event.efficiency() != null ? BigDecimal.valueOf(event.efficiency()) : null);
        if (event.ceoId() != null) enriched.setCeoId(event.ceoId());

        // CEO-change handling: members come back only when the CEO's token is available,
        // so "CEO changed AND members missing" means the new CEO hasn't logged in yet.
        boolean ceoChanged = prevCeoId != null && event.ceoId() != null && !prevCeoId.equals(event.ceoId());
        boolean membersAvailable = event.memberNames() != null;
        if (membersAvailable) {
            enriched.setCeoLoginRequired(false);
        } else if (ceoChanged) {
            enriched.setCeoLoginRequired(true);
        }
        enriched.setLastSyncedAt(syncedAt);
        corpEnrichedRepository.save(enriched);

        if (ceoChanged && !membersAvailable) {
            notifyHrsOfCeoChange(corp, event, prevCeoId);
        }

        // Alliance history — full replace on each sync
        if (event.allianceHistory() != null) {
            allianceHistoryRepository.deleteByCorpId(event.corpId());
            List<CorpAllianceHistory> entries = event.allianceHistory().stream()
                .map(dto -> {
                    CorpAllianceHistory h = new CorpAllianceHistory();
                    h.setCorpId(event.corpId());
                    h.setAllianceId(dto.allianceId());
                    h.setAllianceName(dto.allianceName());
                    h.setStartDate(dto.startDate());
                    h.setEndDate(dto.endDate());
                    return h;
                })
                .toList();
            allianceHistoryRepository.saveAll(entries);
        }

        // Member count snapshot
        if (event.members() != null) {
            CorpMemberSnapshot snap = new CorpMemberSnapshot();
            snap.setCorpId(event.corpId());
            snap.setMembers(event.members());
            snap.setSnappedAt(syncedAt);
            memberSnapshotRepository.save(snap);
        }

        // Roster diff — only when member data was available. EVE Who returns null/empty on
        // a transient blip or an unindexed corp; treat that as "no data" and skip, rather
        // than diffing against an empty roster and wrongly marking the whole corp as LEFT.
        if (event.memberNames() == null || event.memberNames().isEmpty()) {
            log.debug("Corp {}: no roster from EVE Who this sync — skipping member diff", event.corpId());
        } else {
            Map<Long, String> incoming = event.memberNames();

            List<CorpMember> previousRoster = memberRepository.findByCorpIdOrderByCharacterNameAsc(event.corpId());
            Set<Long> previousIds = previousRoster.stream()
                .map(CorpMember::getCharacterId).collect(Collectors.toSet());

            List<CorpMemberEvent> events = new ArrayList<>();
            // Joiners: members not already in the roster. EVE Who carries no join dates, so
            // we record the sync time at which the member was first observed. On the first
            // sync this seeds the full membership as a baseline timeline, which is both safe
            // and useful (unlike sync-time deltas, it can't produce spurious churn).
            for (Map.Entry<Long, String> entry : incoming.entrySet()) {
                if (!previousIds.contains(entry.getKey())) {
                    CorpMemberEvent e = new CorpMemberEvent();
                    e.setCorpId(event.corpId());
                    e.setCharacterId(entry.getKey());
                    e.setCharacterName(entry.getValue());
                    e.setEventType("JOINED");
                    e.setOccurredAt(syncedAt);
                    events.add(e);
                }
            }
            // Leavers: in previous but not in incoming. We record the sync time at which the
            // departure was detected (no source gives a true leave date).
            Set<Long> incomingIds = incoming.keySet();
            for (CorpMember prev : previousRoster) {
                if (!incomingIds.contains(prev.getCharacterId())) {
                    CorpMemberEvent e = new CorpMemberEvent();
                    e.setCorpId(event.corpId());
                    e.setCharacterId(prev.getCharacterId());
                    e.setCharacterName(prev.getCharacterName());
                    e.setEventType("LEFT");
                    e.setOccurredAt(syncedAt);
                    events.add(e);
                }
            }
            memberEventRepository.saveAll(events);

            // Replace roster
            memberRepository.deleteByCorpId(event.corpId());
            List<CorpMember> newRoster = incoming.entrySet().stream()
                .map(entry -> {
                    CorpMember m = new CorpMember();
                    m.setCorpId(event.corpId());
                    m.setCharacterId(entry.getKey());
                    m.setCharacterName(entry.getValue());
                    return m;
                })
                .toList();
            memberRepository.saveAll(newRoster);
        }
    }

    /**
     * Best-effort: ask application-service to drop a "new CEO must log in" notification into
     * the HRs' inboxes (falling back to the former CEO when no HRs are appointed). Never lets
     * a delivery failure break enrichment.
     */
    private void notifyHrsOfCeoChange(Corp corp, CorpEnrichedEvent event, Long prevCeoId) {
        List<Long> recipients = new ArrayList<>();
        if (corp.getHrIds() != null) recipients.addAll(corp.getHrIds());
        if (recipients.isEmpty() && prevCeoId != null) recipients.add(prevCeoId);
        if (recipients.isEmpty()) return;
        try {
            notificationClient.notifyCeoChange(new CeoChangeNotification(
                corp.getCorpId(), corp.getName(), event.ceoId(), event.ceoName(), recipients));
        } catch (Exception e) {
            log.warn("Could not deliver CEO-change notification for corp {}: {}",
                corp.getCorpId(), e.getMessage());
        }
    }
}
