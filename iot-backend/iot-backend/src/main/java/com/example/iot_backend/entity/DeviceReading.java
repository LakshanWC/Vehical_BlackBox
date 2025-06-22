package com.example.iot_backend.entity;

import java.util.Date;

public class DeviceReading {
    private String id;
    private String deviceId;
    private GForce gforces;
    private Gyro gyro;
    private Location location;
    private String fireStatus;
    private String speed;
    private Date timestamp;
    private String status;

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public GForce getGforces() { return gforces; }
    public void setGforces(GForce gforces) { this.gforces = gforces; }
    public Gyro getGyro() { return gyro; }
    public void setGyro(Gyro gyro) { this.gyro = gyro; }
    public Location getLocation() { return location; }
    public void setLocation(Location location) { this.location = location; }
    public String getFireStatus() { return fireStatus; }
    public void setFireStatus(String fireStatus) { this.fireStatus = fireStatus; }
    public String getSpeed() { return speed; }
    public void setSpeed(String speed) { this.speed = speed; }
    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}