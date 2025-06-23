package com.example.iot_backend.service;

import com.example.iot_backend.model.DeviceReading;
import com.google.firebase.database.*;
import org.springframework.stereotype.Service;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

@Service
public class FirebaseService {

    private final FirebaseDatabase database;
//aaa
    public FirebaseService() {
        this.database = FirebaseDatabase.getInstance();
    }

    // Method to save device reading under 'event' node
    public void saveDeviceReading(DeviceReading reading) {
        DatabaseReference ref = database.getReference("event").push();
        ref.setValue(reading, (databaseError, databaseReference) -> {
            if (databaseError != null) {
                System.err.println("Data could not be saved: " + databaseError.getMessage());
            } else {
                System.out.println("Data saved successfully under: " + databaseReference.getKey());
            }
        });
    }

    // Method to get all readings from 'event' node
    public Map<String, DeviceReading> getAllReadings() throws ExecutionException, InterruptedException {
        CompletableFuture<Map<String, DeviceReading>> future = new CompletableFuture<>();

        database.getReference("event")
                .addListenerForSingleValueEvent(new ValueEventListener() {
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

        return future.get();
    }

    // Method to listen for new readings in real-time under 'event' node
    public void listenForNewReadings() {
        database.getReference("event")
                .addChildEventListener(new ChildEventListener() {
                    @Override
                    public void onChildAdded(DataSnapshot dataSnapshot, String prevChildKey) {
                        DeviceReading newReading = dataSnapshot.getValue(DeviceReading.class);
                        System.out.println("New event detected - ID: " + dataSnapshot.getKey());
                        System.out.println("Device: " + newReading.getDeviceId());
                        System.out.println("Timestamp: " + newReading.getTimestamp());

                        // Analyze the reading
                        String result = analyzeReading(newReading);

                        // Update status in Firebase
                        dataSnapshot.getRef().child("status").setValue(result, (dbError, ref) -> {
                            if (dbError == null) {
                                System.out.println("Status updated to: " + result);
                            }
                        });
                    }

                    @Override public void onChildChanged(DataSnapshot dataSnapshot, String s) {}
                    @Override public void onChildRemoved(DataSnapshot dataSnapshot) {}
                    @Override public void onChildMoved(DataSnapshot dataSnapshot, String s) {}
                    @Override public void onCancelled(DatabaseError databaseError) {
                        System.err.println("Listener cancelled: " + databaseError.getMessage());
                    }
                });
    }

    // Enhanced accident detection logic
    private String analyzeReading(DeviceReading reading) {
        try {
            // Parse sensor values
            double xG = Double.parseDouble(reading.getGforces().get("X"));
            double yG = Double.parseDouble(reading.getGforces().get("Y"));
            double zG = Double.parseDouble(reading.getGforces().get("Z"));
            double xGyro = Double.parseDouble(reading.getGyro().get("X"));
            double yGyro = Double.parseDouble(reading.getGyro().get("Y"));

            // Check thresholds
            boolean gForceTrigger = xG > 2.5 || yG > 3.0 || zG < 0.3 || zG > 2.0;
            boolean gyroTrigger = Math.abs(xGyro) > 60 || Math.abs(yGyro) > 60;

            if (gForceTrigger && gyroTrigger) {
                System.out.println("ACCIDENT DETECTED!");
                triggerEmergencyProtocol(reading);
                return "ACCIDENT";
            } else if (gForceTrigger) {
                System.out.println("BUMP DETECTED");
                return "BUMP";
            } else {
                return "NORMAL";
            }
        } catch (Exception e) {
            System.err.println("Error analyzing reading: " + e.getMessage());
            return "ERROR";
        }
    }

    private void triggerEmergencyProtocol(DeviceReading reading) {
        System.out.println("Emergency protocol triggered for device: " + reading.getDeviceId());
        System.out.println("Location: " + reading.getLocation().get("lat") + ", " + reading.getLocation().get("lng"));
    }
}
