package com.findacorp.collector.dto.evewho;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Response from EVE Who {@code GET https://evewho.com/api/corplist/{corporationId}}.
 * Public, unauthenticated — no EVE SSO scope or CEO token required.
 *
 * <p>Note the API quirk: {@code info} is a single-element <em>array</em>, not an object.
 * EVE Who's roster is observed/derived data (it can be incomplete or lag the live corp),
 * and it carries no join dates — so member-change history is built by diffing snapshots.
 */
@Data
public class EveWhoCorpList {

    private List<Info> info;
    private List<Character> characters;

    /**
     * Flattens the response into a {@code characterId → name} roster map, skipping entries
     * without a character id. Returns an empty map when there are no characters.
     */
    public Map<Long, String> toMemberNames() {
        Map<Long, String> names = new HashMap<>();
        if (characters == null) return names;
        for (Character c : characters) {
            if (c != null && c.getCharacterId() != null) {
                names.put(c.getCharacterId(), c.getName());
            }
        }
        return names;
    }

    @Data
    public static class Info {
        @JsonProperty("corporation_id")
        private Long corporationId;
        private String name;
        @JsonProperty("memberCount")
        private Integer memberCount;
    }

    @Data
    public static class Character {
        @JsonProperty("character_id")
        private Long characterId;
        private String name;
    }
}
