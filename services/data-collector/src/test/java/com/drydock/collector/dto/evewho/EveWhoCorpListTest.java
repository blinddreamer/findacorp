package com.drydock.collector.dto.evewho;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class EveWhoCorpListTest {

    private static EveWhoCorpList.Character character(Long id, String name) {
        EveWhoCorpList.Character c = new EveWhoCorpList.Character();
        c.setCharacterId(id);
        c.setName(name);
        return c;
    }

    @Test
    void toMemberNames_mapsCharactersById() {
        EveWhoCorpList list = new EveWhoCorpList();
        list.setCharacters(List.of(
            character(100L, "Pilot One"),
            character(200L, "Pilot Two")
        ));

        Map<Long, String> names = list.toMemberNames();

        assertThat(names).containsOnly(
            Map.entry(100L, "Pilot One"),
            Map.entry(200L, "Pilot Two")
        );
    }

    @Test
    void toMemberNames_skipsEntriesWithoutCharacterId() {
        EveWhoCorpList list = new EveWhoCorpList();
        list.setCharacters(List.of(
            character(100L, "Pilot One"),
            character(null, "Ghost")
        ));

        assertThat(list.toMemberNames()).containsOnlyKeys(100L);
    }

    @Test
    void toMemberNames_emptyWhenNoCharacters() {
        assertThat(new EveWhoCorpList().toMemberNames()).isEmpty();
    }
}
