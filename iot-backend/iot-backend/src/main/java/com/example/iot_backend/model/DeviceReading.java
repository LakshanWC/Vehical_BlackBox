package com.example.iot_backend.model;

import java.util.Map;

public class DeviceReading {
    private String deviceId;
    private String timestamp;
    private Map<String, String> gforces;
    private Map<String, String> gyro;
    private Map<String, String> location;
    private String fireStatus;
    private String speed;
    private String status;

    // Constructors, getters, and setters
    public DeviceReading() {}

    public DeviceReading(String deviceId, String timestamp, Map<String, String> gforces,
                         Map<String, String> gyro, Map<String, String> location,
                         String fireStatus, String speed, String status) {
        this.deviceId = deviceId;
        this.timestamp = timestamp;
        this.gforces = gforces;
        this.gyro = gyro;
        this.location = location;
        this.fireStatus = fireStatus;
        this.speed = speed;
        this.status = status;
    }

    // Getters and Setters for all fields
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public Map<String, String> getGforces() {
        return gforces;
    }

    public void setGforces(Map<String, String> gforces) {
        this.gforces = gforces;
    }

    public Map<String, String> getGyro() {
        return gyro;
    }

    public void setGyro(Map<String, String> gyro) {
        this.gyro = gyro;
    }

    public Map<String, String> getLocation() {
        return location;
    }

    public void setLocation(Map<String, String> location) {
        this.location = location;
    }

    public String getFireStatus() {
        return fireStatus;
    }

    public void setFireStatus(String fireStatus) {
        this.fireStatus = fireStatus;
    }

    public String getSpeed() {
        return speed;
    }

    public void setSpeed(String speed) {
        this.speed = speed;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    // ... Add getters and setters for all other fields
}

