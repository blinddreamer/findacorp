package com.drydock.profile.service;

import com.drydock.profile.domain.Corp;
import com.drydock.profile.domain.CorpEnriched;
import com.drydock.profile.domain.Pilot;
import com.drydock.profile.domain.PilotEnriched;
import com.drydock.profile.dto.CorpSearchResult;
import com.drydock.profile.dto.GlobalSearchResult;
import com.drydock.profile.dto.PilotSearchResult;
import com.drydock.profile.repository.CorpEnrichedRepository;
import com.drydock.profile.repository.CorpRepository;
import com.drydock.profile.repository.PilotEnrichedRepository;
import com.drydock.profile.repository.PilotRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SearchService {

    private static final ObjectMapper JSON = new ObjectMapper();

    private final PilotRepository pilotRepository;
    private final PilotEnrichedRepository pilotEnrichedRepository;
    private final CorpRepository corpRepository;
    private final CorpEnrichedRepository corpEnrichedRepository;

    public Page<PilotSearchResult> searchPilots(List<String> tz, Long minSp, Double minEff,
                                                List<String> roles, List<String> content,
                                                String activity, String sort, Pageable pageable) {
        boolean tzSelected = tz != null && !tz.isEmpty();
        Page<Pilot> page = pilotRepository.search(
            tzSelected ? 1 : 0,
            tzSelected ? tz : List.of("__none__"),
            minSp, minEff, activity,
            toJsonArray(roles), toJsonArray(content), sort, pageable);

        Map<Long, PilotEnriched> enriched = page.isEmpty() ? Map.of()
            : pilotEnrichedRepository.findAllById(page.getContent().stream().map(Pilot::getCharacterId).toList())
                .stream().collect(Collectors.toMap(PilotEnriched::getCharacterId, e -> e));

        return page.map(p -> PilotSearchResult.from(p, enriched.get(p.getCharacterId())));
    }

    public Page<CorpSearchResult> searchCorps(List<String> content, String statusStr,
                                              List<String> tz, Long maxMinSp,
                                              String sort, Pageable pageable) {
        boolean tzSelected = tz != null && !tz.isEmpty();
        Page<Corp> page = corpRepository.search(
            parseStatuses(statusStr),
            toJsonArray(content),
            tzSelected ? 1 : 0,
            tzSelected ? tz : List.of("__none__"),
            maxMinSp, sort, pageable);

        Map<Long, CorpEnriched> enriched = page.isEmpty() ? Map.of()
            : corpEnrichedRepository.findAllById(page.getContent().stream().map(Corp::getCorpId).toList())
                .stream().collect(Collectors.toMap(CorpEnriched::getCorpId, e -> e));

        return page.map(c -> CorpSearchResult.from(c, enriched.get(c.getCorpId())));
    }

    public List<GlobalSearchResult> globalSearch(String q, int limit) {
        if (q == null || q.isBlank()) return List.of();
        List<GlobalSearchResult> results = new ArrayList<>();

        pilotRepository.findByNameContainingIgnoreCaseOrderByNameAsc(q)
            .stream().limit(limit)
            .forEach(p -> results.add(new GlobalSearchResult("pilot", p.getCharacterId(), p.getName(), null)));

        corpRepository.findByNameContainingIgnoreCaseOrderByNameAsc(q)
            .stream().limit(limit)
            .forEach(c -> results.add(new GlobalSearchResult("corp", c.getCorpId(), c.getName(), c.getTicker())));

        return results;
    }

    /** Valid corp status names, defaulting to all when none/invalid are supplied. */
    private List<String> parseStatuses(String statusStr) {
        List<String> all = Arrays.stream(Corp.CorpStatus.values()).map(Enum::name).toList();
        if (statusStr == null || statusStr.isBlank()) return all;
        List<String> parsed = Arrays.stream(statusStr.split(","))
            .map(String::trim)
            .filter(s -> !s.isEmpty())
            .filter(SearchService::isValidStatus)
            .toList();
        return parsed.isEmpty() ? all : parsed;
    }

    private static boolean isValidStatus(String s) {
        try {
            Corp.CorpStatus.valueOf(s);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /** Serialize selected values to a JSON array string for JSON_OVERLAPS, or null to disable. */
    private static String toJsonArray(List<String> values) {
        if (values == null || values.isEmpty()) return null;
        try {
            return JSON.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            return null;
        }
    }
}
