package com.edu.vitals.repository;

import com.edu.vitals.domain.PerformanceLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PerformanceLogRepository extends JpaRepository<PerformanceLog, Long> {
    List<PerformanceLog> findBySessionIdOrderByTimestampAsc(String sessionId);
}
