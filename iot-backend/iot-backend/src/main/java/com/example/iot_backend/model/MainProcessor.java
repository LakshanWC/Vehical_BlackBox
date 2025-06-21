package com.example.iot_backend.model;

import com.example.iot_backend.entity.DeviceReading;
import com.example.iot_backend.service.EmergencyService;
import com.example.iot_backend.service.FirebaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class MainProcessor {
    private static final Logger logger = LoggerFactory.getLogger(MainProcessor.class);

    private final FirebaseService firebaseService;
    private final AccidentAnalyzer analyzer;
    private final EmergencyService emergencyService;

    public MainProcessor(FirebaseService firebaseService,
                         AccidentAnalyzer analyzer,
                         EmergencyService emergencyService) {
        this.firebaseService = firebaseService;
        this.analyzer = analyzer;
        this.emergencyService = emergencyService;
    }

    @Scheduled(fixedRate = 5000) // Run every 5 seconds
    public void processNewEntries() {
        List<DeviceReading> entries = firebaseService.getUnprocessedEntries();

        if (entries.isEmpty()) {
            logger.debug("No new entries to process");
            return;
        }

        logger.info("Processing {} new entries", entries.size());

        entries.forEach(entry -> {
            AnalysisResult result = analyzer.analyze(entry);
            firebaseService.updateStatus(entry.getId(), result);

            logger.info("Processed {}: Status={}, Type={}, Confidence={}",
                    entry.getId(), result.getStatus(), result.getType(), result.getConfidence());

            if ("ACCIDENT".equals(result.getStatus())) {
                emergencyService.triggerEmergencyProtocol(entry, result.getType());
            }
        });
    }
}