package com.example.iot_backend.model;

public class AnalysisResult {
    private String status; // "ACCIDENT", "BUMP", "NORMAL"
    private String type;   // "ROLLOVER", "SIDE_IMPACT", etc.
    private double confidence;

    public AnalysisResult(String status, String type, double confidence) {
        this.status = status;
        this.type = type;
        this.confidence = confidence;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public double getConfidence() {
        return confidence;
    }

    public void setConfidence(double confidence) {
        this.confidence = confidence;
    }
// Constructor, getters and setters
}
