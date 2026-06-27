package com.findacorp.application.repository;

import com.findacorp.application.domain.ApplicationDirection;
import com.findacorp.application.domain.ApplicationStatus;
import com.findacorp.application.domain.MessageThread;
import com.findacorp.application.domain.ThreadType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {

    List<MessageThread> findByIdInOrderByUpdatedAtDesc(Collection<Long> ids);

    boolean existsByPilotIdAndCorpIdAndTypeAndDirectionAndStatusIn(
            Long pilotId, Long corpId, ThreadType type, ApplicationDirection direction,
            Collection<ApplicationStatus> statuses);
}
