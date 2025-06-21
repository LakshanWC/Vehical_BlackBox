package com.example.iot_backend.model;

import com.example.iot_backend.entity.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AccidentAnalyzer {
    private static final Logger logger = LoggerFactory.getLogger(AccidentAnalyzer.class);

    // Thresholds from your specifications
    private static final double G_FORCE_X_THRESHOLD = 2.5;  // Side impact
    private static final double G_FORCE_Y_THRESHOLD = 3.0;  // Frontal/rear impact
    private static final double G_FORCE_Z_MIN = 0.3;        // Vertical forces
    private static final double G_FORCE_Z_MAX = 2.0;
    private static final double GYRO_THRESHOLD = 60.0;      // Abnormal tilt

    public AnalysisResult analyze(DeviceReading reading) {
        GForce g = reading.getGforces();
        Gyro gyro = reading.getGyro();

        boolean gForceAlert = checkGForces(g);
        boolean gyroAlert = checkGyro(gyro);

        if (gForceAlert && gyroAlert) {
            String accidentType = classifyAccidentType(g, gyro);
            double confidence = calculateConfidence(g, gyro);
            return new AnalysisResult("ACCIDENT", accidentType, confidence);
        } else if (gForceAlert) {
            return new AnalysisResult("BUMP", "ROAD_IRREGULARITY", 0.65);
        }
        return new AnalysisResult("NORMAL", "NO_EVENT", 0.99);
    }

    private boolean checkGForces(GForce g) {
        return Math.abs(g.getX()) > G_FORCE_X_THRESHOLD ||
                Math.abs(g.getY()) > G_FORCE_Y_THRESHOLD ||
                g.getZ() < G_FORCE_Z_MIN ||
                g.getZ() > G_FORCE_Z_MAX;
    }

    private boolean checkGyro(Gyro gyro) {
        return Math.abs(gyro.getX()) > GYRO_THRESHOLD ||
                Math.abs(gyro.getY()) > GYRO_THRESHOLD;
    }

    private String classifyAccidentType(GForce g, Gyro gyro) {
        if (g.getZ() < 0.5 && Math.abs(gyro.getX()) > 70) {
            return "ROLLOVER";
        }
        if (Math.abs(g.getX()) > 3.0) {
            return "SIDE_IMPACT";
        }
        if (Math.abs(g.getY()) > 4.0) {
            return "HEAD_ON_COLLISION";
        }
        return "GENERAL_ACCIDENT";
    }

    private double calculateConfidence(GForce g, Gyro gyro) {
        // Simple confidence calculation based on how much thresholds are exceeded
        double confidence = 0.7; // Base confidence

        // Increase confidence based on G-force exceedance
        confidence += Math.min(0.2, (Math.abs(g.getX()) - G_FORCE_X_THRESHOLD) / 10);
        confidence += Math.min(0.2, (Math.abs(g.getY()) - G_FORCE_Y_THRESHOLD) / 10);

        // Increase confidence based on gyro exceedance
        confidence += Math.min(0.1, (Math.abs(gyro.getX()) - GYRO_THRESHOLD) / 100);
        confidence += Math.min(0.1, (Math.abs(gyro.getY()) - GYRO_THRESHOLD) / 100);

        return Math.min(0.99, confidence); // Cap at 99%
    }
}