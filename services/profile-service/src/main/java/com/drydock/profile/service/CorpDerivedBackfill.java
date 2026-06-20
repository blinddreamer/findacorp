package com.drydock.profile.service;

import com.drydock.profile.domain.Corp;
import com.drydock.profile.repository.CorpRepository;
import com.drydock.profile.util.CorpDerived;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Backfills the denormalized {@code tz} / {@code min_sp} columns from each corp's raw JSON
 * fields. Runs at startup but is idempotent — it only writes rows whose derived values are
 * stale, so after the first pass it's a no-op. New edits keep them current via upsertCorp.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CorpDerivedBackfill implements ApplicationRunner {

    private final CorpRepository corpRepository;

    @Override
    public void run(ApplicationArguments args) {
        List<Corp> changed = new ArrayList<>();
        for (Corp c : corpRepository.findAll()) {
            String tz = CorpDerived.inferTz(c.getTzHours());
            Long minSp = CorpDerived.parseMinSp(c.getRequirements());
            if (!Objects.equals(tz, c.getTz()) || !Objects.equals(minSp, c.getMinSp())) {
                c.setTz(tz);
                c.setMinSp(minSp);
                changed.add(c);
            }
        }
        if (!changed.isEmpty()) {
            corpRepository.saveAll(changed);
            log.info("Backfilled tz/min_sp for {} corp(s)", changed.size());
        }
    }
}
