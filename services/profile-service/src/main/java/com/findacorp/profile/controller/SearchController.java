package com.findacorp.profile.controller;

import com.findacorp.profile.dto.CorpSearchResult;
import com.findacorp.profile.dto.GlobalSearchResult;
import com.findacorp.profile.dto.PilotSearchResult;
import com.findacorp.profile.service.CorpService;
import com.findacorp.profile.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;
    private final CorpService corpService;

    /** When true, pilot search (an HR tool) is limited to a corp's CEO or appointed HR. */
    @Value("${app.corp-edit-restricted:false}")
    private boolean corpEditRestricted;

    @GetMapping("/pilots")
    public ResponseEntity<Page<PilotSearchResult>> searchPilots(
            @RequestHeader(value = "X-Character-Id", required = false) Long characterId,
            @RequestParam(value = "tz", required = false) List<String> tz,
            @RequestParam(value = "minSp", required = false) Long minSp,
            @RequestParam(value = "minEff", required = false) Double minEff,
            @RequestParam(value = "roles", required = false) List<String> roles,
            @RequestParam(value = "content", required = false) List<String> content,
            @RequestParam(value = "activity", required = false) String activity,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "24") int size,
            @RequestParam(value = "sort", defaultValue = "sp") String sort) {
        if (corpEditRestricted && !corpService.isRecruiter(characterId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Pilot search is restricted to a corp's CEO or appointed HR");
        }
        return ResponseEntity.ok(
            searchService.searchPilots(tz, minSp, minEff, roles, content, activity, sort,
                PageRequest.of(page, size))
        );
    }

    @GetMapping("/global")
    public ResponseEntity<List<GlobalSearchResult>> globalSearch(
            @RequestParam("q") String q,
            @RequestParam(value = "limit", defaultValue = "5") int limit) {
        return ResponseEntity.ok(searchService.globalSearch(q, limit));
    }

    @GetMapping("/corps")
    public ResponseEntity<Page<CorpSearchResult>> searchCorps(
            @RequestParam(value = "content", required = false) List<String> content,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "tz", required = false) List<String> tz,
            @RequestParam(value = "maxMinSp", required = false) Long maxMinSp,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "24") int size,
            @RequestParam(value = "sort", defaultValue = "members") String sort) {
        return ResponseEntity.ok(
            searchService.searchCorps(content, status, tz, maxMinSp, sort,
                PageRequest.of(page, size))
        );
    }
}
