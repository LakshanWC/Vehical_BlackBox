package com.blackbox_cam.clips.controller;

import com.google.firebase.database.*;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/cam-api/images")
public class ImageController {

    @GetMapping
    public ResponseEntity<Map<String, String>> getAllImages() throws Exception {
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("images");
        final CompletableFuture<Map<String, String>> future = new CompletableFuture<>();

        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            public void onDataChange(DataSnapshot snapshot) {
                Map<String, String> data = new HashMap<>();
                for (DataSnapshot child : snapshot.getChildren()) {
                    String timestamp = child.getKey();
                    String base64Image = child.child("image").getValue(String.class);
                    data.put(timestamp, base64Image);
                }
                future.complete(data);
            }

            public void onCancelled(DatabaseError error) {
                future.completeExceptionally(error.toException());
            }
        });

        Map<String, String> result = future.get(); // wait until result is fetched
        return ResponseEntity.ok(result);
    }
}

