package com.example.iot_backend.service;

import com.example.iot_backend.entity.DeviceReading;
import com.example.iot_backend.entity.GForce;
import com.example.iot_backend.entity.Gyro;
import com.example.iot_backend.entity.Location;
import com.example.iot_backend.model.AnalysisResult;
import com.google.firebase.database.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class FirebaseService {
    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);
    private final DatabaseReference databaseRef;

    @Autowired
    public FirebaseService(FirebaseDatabase firebaseDatabase) {
        this.databaseRef = firebaseDatabase.getReference("event");
    }

    public List<DeviceReading> getUnprocessedEntries() {
        List<DeviceReading> entries = new ArrayList<>();
        CompletableFuture<List<DeviceReading>> future = new CompletableFuture<>();

        databaseRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    for (DataSnapshot child : snapshot.getChildren()) {
                        DeviceReading reading = parseDeviceReading(child);
                        if (reading != null) {
                            reading.setId(child.getKey());
                            entries.add(reading);
                        }
                    }
                }
                future.complete(entries);
                logger.info("Fetched {} entries from Firebase", entries.size());
            }

            @Override
            public void onCancelled(DatabaseError error) {
                logger.error("Error fetching data", error.toException());
                future.complete(Collections.emptyList());
            }
        });

        try {
            return future.get();
        } catch (Exception e) {
            logger.error("Error waiting for data", e);
            return Collections.emptyList();
        }
    }

    private DeviceReading parseDeviceReading(DataSnapshot snapshot) {
        try {
            DeviceReading reading = new DeviceReading();
            reading.setDeviceId(snapshot.child("deviceId").getValue(String.class));
            reading.setFireStatus(snapshot.child("fireStatus").getValue(String.class));
            reading.setSpeed(snapshot.child("speed").getValue(String.class));

            // Parse GForce
            DataSnapshot gforceSnap = snapshot.child("gforces");
            GForce gforce = new GForce();
            gforce.setX(parseDouble(gforceSnap.child("X").getValue(String.class)));
            gforce.setY(parseDouble(gforceSnap.child("Y").getValue(String.class)));
            gforce.setZ(parseDouble(gforceSnap.child("Z").getValue(String.class)));
            reading.setGforces(gforce);

            // Parse Gyro
            DataSnapshot gyroSnap = snapshot.child("gyro");
            Gyro gyro = new Gyro();
            gyro.setX(parseDouble(gyroSnap.child("X").getValue(String.class)));
            gyro.setY(parseDouble(gyroSnap.child("Y").getValue(String.class)));
            gyro.setZ(parseDouble(gyroSnap.child("Z").getValue(String.class)));
            reading.setGyro(gyro);

            // Parse Location
            DataSnapshot locSnap = snapshot.child("location");
            Location location = new Location();
            location.setLat(parseDouble(locSnap.child("lat").getValue(String.class)));
            location.setLng(parseDouble(locSnap.child("lng").getValue(String.class)));
            reading.setLocation(location);

            return reading;
        } catch (Exception e) {
            logger.error("Error parsing device reading", e);
            return null;
        }
    }

    private Double parseDouble(String value) {
        try {
            return (value == null || value.isEmpty()) ? 0.0 : Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    public void updateStatus(String docId, AnalysisResult result) {
        Map<String, Object> updates = new HashMap<>();
        updates.put("status", result.getStatus());
        updates.put("accidentType", result.getType());
        updates.put("confidence", result.getConfidence());
        updates.put("lastAnalyzed", ServerValue.TIMESTAMP);

        databaseRef.child(docId).updateChildren(updates, (error, ref) -> {
            if (error != null) {
                logger.error("Error updating document status", error.toException());
            }
        });
    }
}