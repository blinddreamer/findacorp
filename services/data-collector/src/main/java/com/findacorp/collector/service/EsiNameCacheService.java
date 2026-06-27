package com.findacorp.collector.service;

import com.findacorp.collector.dto.esi.EsiAllianceInfo;
import com.findacorp.collector.dto.esi.EsiCorpInfo;
import com.findacorp.collector.dto.esi.EsiGroupInfo;
import com.findacorp.collector.dto.esi.EsiSystemInfo;
import com.findacorp.collector.dto.esi.EsiTypeInfo;
import com.findacorp.collector.feign.EsiClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory cache for ESI name lookups. Survives for the lifetime of the process.
 * ESI data changes rarely, so no TTL is needed for type/group/system names.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EsiNameCacheService {

    private final EsiClient esiClient;

    private final ConcurrentHashMap<Integer, EsiTypeInfo> typeCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, EsiGroupInfo> groupCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Integer, EsiSystemInfo> systemCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, EsiCorpInfo> corpCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, EsiAllianceInfo> allianceCache = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<Long, String> characterNameCache = new ConcurrentHashMap<>();

    public EsiTypeInfo getTypeInfo(int typeId) {
        return typeCache.computeIfAbsent(typeId, id -> {
            try {
                return esiClient.getTypeInfo(id);
            } catch (Exception e) {
                log.debug("ESI type lookup failed for {}: {}", id, e.getMessage());
                EsiTypeInfo fallback = new EsiTypeInfo();
                fallback.setName("Type " + id);
                fallback.setGroupId(0);
                return fallback;
            }
        });
    }

    public EsiGroupInfo getGroupInfo(int groupId) {
        return groupCache.computeIfAbsent(groupId, id -> {
            try {
                return esiClient.getGroupInfo(id);
            } catch (Exception e) {
                log.debug("ESI group lookup failed for {}: {}", id, e.getMessage());
                EsiGroupInfo fallback = new EsiGroupInfo();
                fallback.setName("Group " + id);
                fallback.setCategoryId(0);
                return fallback;
            }
        });
    }

    public String getSystemName(int systemId) {
        EsiSystemInfo info = systemCache.computeIfAbsent(systemId, id -> {
            try {
                return esiClient.getSystemInfo(id);
            } catch (Exception e) {
                log.debug("ESI system lookup failed for {}: {}", id, e.getMessage());
                EsiSystemInfo fallback = new EsiSystemInfo();
                fallback.setName("System " + id);
                return fallback;
            }
        });
        return info.getName();
    }

    public EsiCorpInfo getCorpInfo(long corpId) {
        return corpCache.computeIfAbsent(corpId, id -> {
            try {
                return esiClient.getCorpInfo(id);
            } catch (Exception e) {
                log.debug("ESI corp lookup failed for {}: {}", id, e.getMessage());
                EsiCorpInfo fallback = new EsiCorpInfo();
                fallback.setName("Corp " + id);
                return fallback;
            }
        });
    }

    public EsiAllianceInfo getAllianceInfo(long allianceId) {
        return allianceCache.computeIfAbsent(allianceId, id -> {
            try {
                return esiClient.getAllianceInfo(id);
            } catch (Exception e) {
                log.debug("ESI alliance lookup failed for {}: {}", id, e.getMessage());
                EsiAllianceInfo fallback = new EsiAllianceInfo();
                fallback.setName("Alliance " + id);
                return fallback;
            }
        });
    }

    public String getCharacterName(long characterId) {
        return characterNameCache.computeIfAbsent(characterId, id -> {
            try {
                String name = esiClient.getCharacterInfo(id).getName();
                return name != null ? name : "Unknown";
            } catch (Exception e) {
                log.debug("ESI character name lookup failed for {}: {}", id, e.getMessage());
                return "Unknown";
            }
        });
    }
}
