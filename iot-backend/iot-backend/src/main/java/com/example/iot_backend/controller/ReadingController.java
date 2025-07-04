package com.example.iot_backend.controller;

import com.example.iot_backend.model.DeviceReading;
import com.example.iot_backend.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/events")
public class ReadingController {

    @Autowired
    private FirebaseService firebaseService;

    @PostMapping
    public ResponseEntity<String> saveReading(@RequestBody DeviceReading reading) {
        try {
            firebaseService.saveDeviceReading(reading);
            return ResponseEntity.ok("Event saved successfully under 'event' node");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Error saving event: " + e.getMessage());
        }
    }

    @GetMapping
    public CompletableFuture<ResponseEntity<Map<String, DeviceReading>>> getAllEvents() {
        return firebaseService.getAllReadings()
                .thenApply(ResponseEntity::ok)
                .exceptionally(e -> ResponseEntity.internalServerError().build());
    }

    @GetMapping("/start-monitoring")
    public ResponseEntity<String> startMonitoring() {
        try {
            firebaseService.listenForNewReadings();
            return ResponseEntity.ok("Started monitoring 'event' node for new readings");
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("Failed to start monitoring: " + e.getMessage());
        }
    }

    @GetMapping("/{eventId}")
    public ResponseEntity<DeviceReading> getEventById(@PathVariable String eventId) {
        return ResponseEntity.notFound().build();
    }
    @GetMapping("/retrigger-alerts")
    public ResponseEntity<String> retriggerAlerts() {
        firebaseService.retriggerAlertsForPastAccidents();
        return ResponseEntity.ok("Re-processing past accidents for email alerts");
    }

}
