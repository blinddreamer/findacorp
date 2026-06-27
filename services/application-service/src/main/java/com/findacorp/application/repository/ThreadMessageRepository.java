package com.findacorp.application.repository;

import com.findacorp.application.domain.ThreadMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ThreadMessageRepository extends JpaRepository<ThreadMessage, Long> {

    List<ThreadMessage> findByThreadIdOrderBySentAtAsc(Long threadId);

    ThreadMessage findTopByThreadIdOrderBySentAtDesc(Long threadId);
}
