package com.drydock.auth.repository;

import com.drydock.auth.domain.OauthState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;

public interface OauthStateRepository extends JpaRepository<OauthState, String> {

    @Modifying
    @Query("DELETE FROM OauthState o WHERE o.createdAt < :cutoff")
    void deleteExpiredStates(LocalDateTime cutoff);
}
