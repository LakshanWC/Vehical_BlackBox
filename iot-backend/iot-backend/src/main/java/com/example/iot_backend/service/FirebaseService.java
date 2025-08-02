package com.example.iot_backend.service;

import com.example.iot_backend.model.DeviceReading;
import com.google.firebase.database.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

@Service
public class FirebaseService {
    private final FirebaseDatabase database;
    private final EmailService emailService;
    private DatabaseReference eventsRef;
    private DatabaseReference rootRef;
    private final Executor executor = Executors.newFixedThreadPool(4);
    private static final Logger logger = LoggerFactory.getLogger(FirebaseService.class);
    private final Map<String, List<Map<String, String>>> deviceTrajectories = new HashMap<>();

    @Autowired
    public FirebaseService(EmailService emailService) {
        this.database = FirebaseDatabase.getInstance();
        this.emailService = emailService;
        this.eventsRef = database.getReference("events");
        this.rootRef = database.getReference("/");
    }

    public void saveDeviceReading(DeviceReading reading) {
        DatabaseReference newEventRef = eventsRef.push();
        reading.setId(newEventRef.getKey());
        newEventRef.setValueAsync(reading)
                .addListener(() -> System.out.println("Data saved under: " + newEventRef.getKey()), executor);
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

        // Get emergency contacts and owner email from root
        rootRef.child("emergencyContacts").addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot contactsSnapshot) {
                if (contactsSnapshot.exists()) {
                    reading.setEmergencyContacts((Map<String, String>) contactsSnapshot.getValue());
                }

                rootRef.child("ownerEmail").addListenerForSingleValueEvent(new ValueEventListener() {
                    @Override
                    public void onDataChange(DataSnapshot emailSnapshot) {
                        if (emailSnapshot.exists()) {
                            reading.setOwnerEmail(emailSnapshot.getValue(String.class));
                        }
                        analyzeAndAlert(reading, snapshot);
                    }

                    @Override
                    public void onCancelled(DatabaseError error) {
                        analyzeAndAlert(reading, snapshot);
                    }
                });
            }

            @Override
            public void onCancelled(DatabaseError error) {
                analyzeAndAlert(reading, snapshot);
            }
        });
    }

    private void analyzeAndAlert(DeviceReading reading, DataSnapshot snapshot) {
        // Handle speed trajectory calculation first
        if (reading.getSpeed() != null && !reading.getSpeed().equals("waiting-gps")) {
            try {
                double speed = Double.parseDouble(reading.getSpeed().replace(" km/h", ""));
                if (speed > 60) {
                    updateSpeedTrajectory(reading, snapshot);
                }
            } catch (NumberFormatException e) {
                logger.warn("Invalid speed format: {}", reading.getSpeed());
            }
        }

        String status = analyzeReading(reading);
        snapshot.getRef().child("status").setValueAsync(status);
    }

    private void updateSpeedTrajectory(DeviceReading reading, DataSnapshot snapshot) {
        String deviceId = reading.getDeviceId();
        Map<String, String> currentLocation = reading.getLocation();

        if (currentLocation == null ||
                currentLocation.get("lat").equals("waiting-gps") ||
                currentLocation.get("lng").equals("waiting-gps")) {
            return;
        }

        // Initialize trajectory for device if not exists
        deviceTrajectories.putIfAbsent(deviceId, new ArrayList<>());

        // Add current location to trajectory
        deviceTrajectories.get(deviceId).add(currentLocation);

        // Keep only the last 10 locations for trajectory calculation
        if (deviceTrajectories.get(deviceId).size() > 10) {
            deviceTrajectories.get(deviceId).remove(0);
        }

        // Only create trajectory if we have at least 2 points
        if (deviceTrajectories.get(deviceId).size() >= 2) {
            Map<String, Object> trajectory = new HashMap<>();
            trajectory.put("start", deviceTrajectories.get(deviceId).get(0));
            trajectory.put("end", currentLocation);
            trajectory.put("path", new ArrayList<>(deviceTrajectories.get(deviceId)));

            snapshot.getRef().child("speedTrajectory").setValueAsync(trajectory);
        }
    }


    private String analyzeReading(DeviceReading reading) {
        try {
            boolean isFire = "1".equals(reading.getFireStatus());
            boolean isAccident = false;

            if (reading.getGforces() != null) {
                double xG = parseDoubleSafe(reading.getGforces().get("X"));
                double yG = parseDoubleSafe(reading.getGforces().get("Y"));
                isAccident = xG > 2.5 || yG > 3.0;
            }

            if (isFire) {
                triggerEmergencyProtocol(reading, "FIRE");
                return "FIRE";
            } else if (isAccident) {
                triggerEmergencyProtocol(reading, "ACCIDENT");
                return "ACCIDENT";
            }
            return "NORMAL";
        } catch (Exception e) {
            return "ERROR";
        }
    }

    private double parseDoubleSafe(String value) {
        if (value == null || value.isEmpty()) return 0.0;
        try {
            return Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private void triggerEmergencyProtocol(DeviceReading reading, String alertType) {
        try {
            //prepare recipients list
            List<String> recipients = new ArrayList<>();

            // Add owner email if exists
            if (reading.getOwnerEmail() != null && !reading.getOwnerEmail().isEmpty()) {
                recipients.add(reading.getOwnerEmail());
            }

            // Add emergency contacts if exists
            if (reading.getEmergencyContacts() != null) {
                recipients.addAll(reading.getEmergencyContacts().values());
            }

            // Remove duplicates and empty emails
            recipients = recipients.stream()
                    .filter(email -> email != null && !email.isEmpty())
                    .distinct()
                    .toList();

            if (recipients.isEmpty()) {
                logger.warn("No valid recipients found for alert");
                return;
            }

            String subject = "🚨 " + alertType + " Alert - Device: " + reading.getDeviceId();
            String content = buildAlertContent(reading, alertType);

            // Send to all recipients
            recipients.forEach(email -> {
                try {
                    emailService.sendEmergencyAlert(email, subject, content);
                    logger.info("Alert sent to: {}", email);

                    // Add a small delay between emails to avoid rate limiting
                    Thread.sleep(200);
                } catch (Exception e) {
                    logger.error("Failed to send alert to {}: {}", email, e.getMessage());
                }
            });
        } catch (Exception e) {
            logger.error("Error triggering emergency protocol: {}", e.getMessage());
        }
    }

    private String buildAlertContent(DeviceReading reading, String alertType) {
        StringBuilder sb = new StringBuilder();
        sb.append("=== ").append(alertType).append(" ALERT ===\n\n");
        sb.append("Device ID: ").append(reading.getDeviceId()).append("\n");
        sb.append("Timestamp: ").append(reading.getTimestamp()).append("\n");

        if (reading.getLocation() != null) {
            sb.append("Location Coordinates: ")
                    .append(reading.getLocation().get("lat"))
                    .append(", ")
                    .append(reading.getLocation().get("lng"))
                    .append("\n");

            // Add Google Maps link
            sb.append("Google Maps: https://www.google.com/maps?q=")
                    .append(reading.getLocation().get("lat"))
                    .append(",")
                    .append(reading.getLocation().get("lng"))
                    .append("\n");
        }

        if (reading.getGforces() != null) {
            sb.append("\nImpact Forces:\n")
                    .append("- X: ").append(reading.getGforces().get("X")).append("G (Side impact)\n")
                    .append("- Y: ").append(reading.getGforces().get("Y")).append("G (Frontal/rear impact)\n")
                    .append("- Z: ").append(reading.getGforces().get("Z")).append("G (Vertical force)\n");
        }

        if (reading.getGyro() != null) {
            sb.append("\nVehicle Orientation:\n")
                    .append("- X: ").append(reading.getGyro().get("X")).append("° (Roll)\n")
                    .append("- Y: ").append(reading.getGyro().get("Y")).append("° (Pitch)\n")
                    .append("- Z: ").append(reading.getGyro().get("Z")).append("° (Yaw)\n");
        }

        sb.append("\nSpeed: ").append(reading.getSpeed() != null ? reading.getSpeed() : "N/A").append(" km/h\n");
        sb.append("\n=== END OF ALERT ===\n");
        sb.append("\nPlease take immediate action and contact emergency services if needed.");

        return sb.toString();
    }

    public CompletableFuture<DeviceReading> getReadingById(String eventId) {
        CompletableFuture<DeviceReading> future = new CompletableFuture<>();

        eventsRef.child(eventId).addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot snapshot) {
                if (snapshot.exists()) {
                    DeviceReading reading = snapshot.getValue(DeviceReading.class);

                    // Get contacts and owner email from root
                    rootRef.child("emergencyContacts").addListenerForSingleValueEvent(new ValueEventListener() {
                        @Override
                        public void onDataChange(DataSnapshot contactsSnapshot) {
                            if (contactsSnapshot.exists()) {
                                reading.setEmergencyContacts((Map<String, String>) contactsSnapshot.getValue());
                            }

                            rootRef.child("ownerEmail").addListenerForSingleValueEvent(new ValueEventListener() {
                                @Override
                                public void onDataChange(DataSnapshot emailSnapshot) {
                                    if (emailSnapshot.exists()) {
                                        reading.setOwnerEmail(emailSnapshot.getValue(String.class));
                                    }
                                    future.complete(reading);
                                }

                                @Override
                                public void onCancelled(DatabaseError error) {
                                    future.complete(reading);
                                }
                            });
                        }

                        @Override
                        public void onCancelled(DatabaseError error) {
                            future.complete(reading);
                        }
                    });
                } else {
                    future.complete(null);
                }
            }

            @Override
            public void onCancelled(DatabaseError error) {
                future.completeExceptionally(error.toException());
            }
        });

        return future;
    }
    public void retriggerAlertsForPastAccidents() {
        eventsRef.addListenerForSingleValueEvent(new ValueEventListener() {
            @Override
            public void onDataChange(DataSnapshot dataSnapshot) {
                for (DataSnapshot snapshot : dataSnapshot.getChildren()) {
                    DeviceReading reading = snapshot.getValue(DeviceReading.class);
                    if (reading != null && ("ACCIDENT".equals(reading.getStatus()) || "FIRE".equals(reading.getStatus()))) {
                        triggerEmergencyProtocol(reading, reading.getStatus());
                    }
                }
            }
            @Override
            public void onCancelled(DatabaseError error) {
                logger.error("Failed to load past accidents: {}", error.getMessage());
            }
        });
    }
}