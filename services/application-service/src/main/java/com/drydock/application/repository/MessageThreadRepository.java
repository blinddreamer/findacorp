package com.drydock.application.repository;

import com.drydock.application.domain.ApplicationDirection;
import com.drydock.application.domain.ApplicationStatus;
import com.drydock.application.domain.MessageThread;
import com.drydock.application.domain.ThreadType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MessageThreadRepository extends JpaRepository<MessageThread, Long> {

    List<MessageThread> findByIdInOrderByUpdatedAtDesc(Collection<Long> ids);

    boolean existsByPilotIdAndCorpIdAndTypeAndDirectionAndStatusIn(
            Long pilotId, Long corpId, ThreadType type, ApplicationDirection direction,
            Collection<ApplicationStatus> statuses);
}
