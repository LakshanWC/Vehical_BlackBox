package com.example.iot_backend.model;

import java.util.Collections;
import java.util.Map;

public class DeviceReading {
    private String id;  // Firebase-generated ID
    private String deviceId;
    private String timestamp;
    private Map<String, String> gforces;
    private Map<String, String> gyro;
    private Map<String, String> location;  // Original location data
    private Map<String, Object> locationData;  // Enhanced location data
    private String fireStatus;
    private String speed;
    private String status;
    private String address;
    private Map<String, Object> mapData;
    private Map<String, String> emergencyContacts;
    private String ownerEmail;

    // Constructors
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

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

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

    public Map<String, Object> getLocationData() {
        return locationData;
    }

    public void setLocationData(Map<String, Object> locationData) {
        this.locationData = locationData;
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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Map<String, Object> getMapData() {
        return mapData;
    }

    public void setMapData(Map<String, Object> mapData) {
        this.mapData = mapData;
    }
    public Map<String, String> getEmergencyContacts() {
        return emergencyContacts != null ? emergencyContacts : Collections.emptyMap();
    }

    public void setEmergencyContacts(Map<String, String> emergencyContacts) {
        this.emergencyContacts = emergencyContacts;
    }

    public String getOwnerEmail() {
        return ownerEmail;
    }

    public void setOwnerEmail(String ownerEmail) {
        this.ownerEmail = ownerEmail;
    }

    // Helper methods
    public Double getLatitude() {
        if (location != null && location.containsKey("lat")) {
            try {
                return Double.parseDouble(location.get("lat"));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public Double getLongitude() {
        if (location != null && location.containsKey("lng")) {
            try {
                return Double.parseDouble(location.get("lng"));
            } catch (NumberFormatException e) {
                return null;
            }
        }
        return null;
    }

    public String getMarkerColor() {
        if (mapData != null && mapData.containsKey("markerColor")) {
            return (String) mapData.get("markerColor");
        }
        return "#808080"; // Default gray
    }

    public Integer getMarkerSize() {
        if (mapData != null && mapData.containsKey("markerSize")) {
            return (Integer) mapData.get("markerSize");
        }
        return 15; // Default size
    }
}