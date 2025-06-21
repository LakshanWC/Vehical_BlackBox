package com.example.iot_backend.service;

import com.example.iot_backend.entity.DeviceReading;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class EmergencyService {
    private static final Logger logger = LoggerFactory.getLogger(EmergencyService.class);

    public void triggerEmergencyProtocol(DeviceReading reading, String accidentType) {
        // Implement your emergency notification logic here
        logger.warn("EMERGENCY ALERT - Accident Type: {}", accidentType);
        logger.warn("Location: {}", reading.getLocation());
        logger.warn("Vehicle Speed: {} km/h", reading.getSpeed());

        // In a real implementation, you would:
        // 1. Send SMS alerts
        // 2. Send email notifications
        // 3. Call emergency services APIs
        // 4. Notify family contacts
    }
}