package com.example.iot_backend.controller;

import com.example.iot_backend.entity.DeviceReading;
import com.example.iot_backend.service.FirebaseService;
import com.google.firebase.database.DatabaseReference;
import com.google.firebase.database.FirebaseDatabase;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/accidents")
public class AccidentController {
    private final FirebaseService firebaseService;
    private final FirebaseDatabase firebaseDatabase;

    public AccidentController(FirebaseService firebaseService,
                              FirebaseDatabase firebaseDatabase) {
        this.firebaseService = firebaseService;
        this.firebaseDatabase = firebaseDatabase;
    }

    @GetMapping
    public List<DeviceReading> getAllAccidents() {
        return firebaseService.getUnprocessedEntries();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DeviceReading> getAccidentById(@PathVariable String id) {
        // Implement later
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/test-connection")
    public String testConnectionBasic() {
        try {
            List<DeviceReading> readings = firebaseService.getUnprocessedEntries();
            return "Successfully fetched " + readings.size() + " records from Firebase";
        } catch (Exception e) {
            return "Firebase connection failed: " + e.getMessage();
        }
    }

    @GetMapping("/test-firebase")
    public ResponseEntity<Map<String, Object>> testFirebase() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DeviceReading> readings = firebaseService.getUnprocessedEntries();
            response.put("status", "success");
            response.put("recordCount", readings.size());
            response.put("sampleRecord", readings.isEmpty() ? null : readings.get(0));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("status", "error");
            response.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}