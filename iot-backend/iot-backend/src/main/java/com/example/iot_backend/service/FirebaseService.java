package com.example.iot_backend.service;

import com.example.iot_backend.model.DeviceReading;
import com.google.firebase.database.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Service
public class FirebaseService {

    private final FirebaseDatabase database;
    private final GeocodingService geocodingService;
    private DatabaseReference eventsRef;
    // Add this with your other class members
    private final Executor executor = Executors.newFixedThreadPool(4);

    @Autowired
    public FirebaseService(GeocodingService geocodingService) {
        this.database = FirebaseDatabase.getInstance();
        this.geocodingService = geocodingService;
        this.eventsRef = database.getReference("events");
    }

    public void saveDeviceReading(DeviceReading reading) {
        DatabaseReference newEventRef = eventsRef.push();
        reading.setId(newEventRef.getKey()); // Set the generated ID in the model

        // Enhanced location data structure
        if (reading.getLocation() != null) {
            Map<String, Object> locationData = new HashMap<>();
            locationData.put("coordinates", reading.getLocation());

            // Fixed the generateGeoHash call with proper parenthesis
            locationData.put("geoHash", generateGeoHash(
                    Double.parseDouble(reading.getLocation().get("lat")),
                    Double.parseDouble(reading.getLocation().get("lng"))
            ));
            reading.setLocationData(locationData);
        }

        newEventRef.setValueAsync(reading)
                .addListener(() -> System.out.println("Data saved successfully under: " + newEventRef.getKey()),
                        executor);
    }

    public CompletableFuture<Map<String, DeviceReading>> getAllReadings() {
        CompletableFuture<Map<String, DeviceReading>> future = new CompletableFuture<>();

        eventsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                Map<String, DeviceReading> readings = new HashMap<>();
                for (DataSnapshot childSnapshot : dataSnapshot.getChildren()) {
                    readings.put(childSnapshot.getKey(), childSnapshot.getValue(DeviceReading.class));
                }
                future.complete(readings);
            }

            @Override
            public void onCancelled(DatabaseError databaseError) {
                future.completeExceptionally(databaseError.toException());
            }
        });

        return future;
    }

    public void listenForNewReadings() {
        eventsRef.addChildEventListener(new ChildEventListener() {
            @Override
            public void onChildAdded(DataSnapshot snapshot, String prevKey) {
                processNewReading(snapshot);
            }

            @Override
            public void onChildChanged(DataSnapshot snapshot, String prevKey) {
                processNewReading(snapshot);
            }

            @Override public void onChildRemoved(DataSnapshot snapshot) {}
            @Override public void onChildMoved(DataSnapshot snapshot, String prevKey) {}
            @Override public void onCancelled(DatabaseError error) {
                System.err.println("Listener cancelled: " + error.getMessage());
            }
        });
    }

    private void processNewReading(DataSnapshot snapshot) {
        DeviceReading reading = snapshot.getValue(DeviceReading.class);
        if (reading == null) return;

        // 1. Analyze and classify
        String status = analyzeReading(reading);
        snapshot.getRef().child("status").setValueAsync(status);

        // 2. Process location data for mapping
        if (reading.getLocation() != null) {
            Map<String, Object> mapData = new HashMap<>();
            mapData.put("lat", reading.getLocation().get("lat"));
            mapData.put("lng", reading.getLocation().get("lng"));
            mapData.put("zoom", calculateZoomLevel(reading));

            // Add marker styling based on classification
            mapData.put("markerColor", getMarkerColor(status));
            mapData.put("markerSize", getMarkerSize(reading));

            snapshot.getRef().child("mapData").setValueAsync(mapData);

            // 3. Geocode for important events
            if (status.equals("ACCIDENT")) {
                CompletableFuture.runAsync(() -> {
                    String address = geocodingService.reverseGeocodeWithRetry(
                            reading.getLocation().get("lat"),
                            reading.getLocation().get("lng"),
                            3
                    );
                    if (address != null) {
                        snapshot.getRef().child("address").setValueAsync(address);
                    }
                });
            }
        }
    }

    private String generateGeoHash(double lat, double lng) {
        // Implement geo-hashing for spatial queries
        // Can use libraries like 'ch.hsr.geohash' or simple implementation
        return String.format("%.4f,%.4f", lat, lng);
    }

    private String calculateZoomLevel(DeviceReading reading) {
        // Dynamic zoom based on event type
        return reading.getStatus().equals("ACCIDENT") ? "17" : "15";
    }

    private String getMarkerColor(String status) {
        return switch (status) {
            case "ACCIDENT" -> "#ff0000";
            case "BUMP" -> "#ffa500";
            case "NORMAL" -> "#00ff00";
            default -> "#808080";
        };
    }

    private int getMarkerSize(DeviceReading reading) {
        try {
            double impact = Double.parseDouble(reading.getGforces().get("Y"));
            return (int) Math.min(30, Math.max(10, impact * 5));
        } catch (Exception e) {
            return 15;
        }
    }

    private String analyzeReading(DeviceReading reading) {
        try {
            if (!isValidSensorReading(reading)) {
                return "ERROR";
            }

            double xG = Double.parseDouble(reading.getGforces().get("X"));
            double yG = Double.parseDouble(reading.getGforces().get("Y"));
            double zG = Double.parseDouble(reading.getGforces().get("Z"));
            double xGyro = Double.parseDouble(reading.getGyro().get("X"));
            double yGyro = Double.parseDouble(reading.getGyro().get("Y"));

            boolean gForceTrigger = xG > 2.5 || yG > 3.0 || zG < 0.3 || zG > 2.0;
            boolean gyroTrigger = Math.abs(xGyro) > 60 || Math.abs(yGyro) > 60;

            if (gForceTrigger && gyroTrigger) {
                triggerEmergencyProtocol(reading);
                return "ACCIDENT";
            } else if (gForceTrigger) {
                return "BUMP";
            }
            return "NORMAL";
        } catch (Exception e) {
            return "ERROR";
        }
    }

    private boolean isValidSensorReading(DeviceReading reading) {
        try {
            double x = Double.parseDouble(reading.getGforces().get("X"));
            double y = Double.parseDouble(reading.getGforces().get("Y"));
            return x >= -20 && x <= 20 && y >= -20 && y <= 20;
        } catch (Exception e) {
            return false;
        }
    }

    private void triggerEmergencyProtocol(DeviceReading reading) {
        System.out.println("Emergency alert for device: " + reading.getDeviceId());
        if (reading.getLocation() != null) {
            System.out.println("Location: " +
                    reading.getLocation().get("lat") + "," +
                    reading.getLocation().get("lng"));
        }
    }
}