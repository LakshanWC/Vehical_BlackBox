package com.example.iot_backend.controller;



import com.example.iot_backend.model.DeviceReading;
import com.example.iot_backend.service.FirebaseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
//aaa
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
    public ResponseEntity<Map<String, DeviceReading>> getAllEvents() {
        try {
            Map<String, DeviceReading> events = firebaseService.getAllReadings();
            return ResponseEntity.ok(events);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(null);
        }
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
        // Implementation to get specific event by ID
        // You would use database.getReference("event").child(eventId).addListenerForSingleValueEvent(...)
        return ResponseEntity.notFound().build();
    }
}
