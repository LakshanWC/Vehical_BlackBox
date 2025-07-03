package com.blackbox_cam.clips.service;

import com.google.firebase.cloud.StorageClient;
import com.google.firebase.database.*;
import org.apache.commons.io.FileUtils;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class VideoService {

    private final Path tempImageDir = Paths.get("temp_images");
    private final Path videoDir = Paths.get("videos");
    private final String videoFileName = "output.mp4";

    public void createVideoAndUpload() throws Exception {
        // 1. Fetch image data from Firebase
        Map<String, String> images = fetchBase64Images();

        // 2. Save images as .jpg files
        saveImages(images);

        // 3. Generate video using FFmpeg
        generateVideoFromImages();

        // 4. Upload video to Firebase Storage
       // System.out.println("Video uploaded. Download URL: " + downloadUrl);

        // 5. (Optional) Save the URL in Firebase DB
       // saveVideoUrlInRealtimeDB(downloadUrl);

        // Cleanup temp files
        cleanup();
    }

    private Map<String, String> fetchBase64Images() throws Exception {
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("images");
        CompletableFuture<Map<String, String>> future = new CompletableFuture<>();

        ref.addListenerForSingleValueEvent(new ValueEventListener() {
            public void onDataChange(DataSnapshot snapshot) {
                Map<String, String> result = new TreeMap<>();
                for (DataSnapshot child : snapshot.getChildren()) {
                    String base64 = child.child("image").getValue(String.class);
                    result.put(child.getKey(), base64);
                }
                future.complete(result);
            }

            public void onCancelled(DatabaseError error) {
                future.completeExceptionally(error.toException());
            }
        });

        return future.get();
    }

    private void saveImages(Map<String, String> base64Images) throws IOException {
        if (!Files.exists(tempImageDir)) Files.createDirectories(tempImageDir);

        int index = 1;
        for (Map.Entry<String, String> entry : base64Images.entrySet()) {
            Path imagePath = tempImageDir.resolve(String.format("frame_%03d.jpg", index++));
            if (Files.exists(imagePath)) {
                // Skip saving if file already exists
                continue;
            }
            byte[] imageBytes = Base64.getDecoder().decode(entry.getValue());
            Files.write(imagePath, imageBytes);
        }
    }


    private void generateVideoFromImages() throws IOException, InterruptedException {
        ProcessBuilder pb = new ProcessBuilder(
                "D:\\HNDSE_242\\IOT\\ffmpeg-2025-07-01-git-11d1b71c31-full_build\\bin\\ffmpeg.exe",
                "-framerate", "1",
                "-i", "frame_%03d.jpg",
                "-c:v", "libx264",
                "-r", "30",
                "-pix_fmt", "yuv420p",
                videoFileName
        );
        pb.directory(tempImageDir.toFile());
        pb.inheritIO();
        Process process = pb.start();
        int exitCode = process.waitFor();

        if (exitCode != 0) {
            throw new RuntimeException("FFmpeg failed with exit code " + exitCode);
        }
    }

    public String createVideoAndSaveLocally() throws Exception {
        Map<String, String> images = fetchBase64Images();

        if (images.isEmpty()) {
            throw new RuntimeException("No images found in Firebase.");
        }

        // Determine how many frames to use
        int totalFrames = images.size();
        int framesToUse = (totalFrames < 30) ? 10 : 30;
        framesToUse = Math.min(framesToUse, totalFrames);

        saveLastNImages(images, framesToUse);
        generateVideoFromImages();

        // Move video from temp_images to videos folder and rename uniquely
        if (!Files.exists(videoDir)) Files.createDirectories(videoDir);
        String uniqueVideoName = "video_" + System.currentTimeMillis() + ".mp4";
        Path videoSourcePath = tempImageDir.resolve(videoFileName);
        Path videoTargetPath = videoDir.resolve(uniqueVideoName);
        Files.move(videoSourcePath, videoTargetPath, StandardCopyOption.REPLACE_EXISTING);

        cleanup();

        return uniqueVideoName;
    }

    private void saveLastNImages(Map<String, String> base64Images, int n) throws IOException {
        if (!Files.exists(tempImageDir)) Files.createDirectories(tempImageDir);

        List<Map.Entry<String, String>> entries = new ArrayList<>(base64Images.entrySet());
        int total = entries.size();

        List<Map.Entry<String, String>> lastEntries = entries.subList(total - n, total);

        int index = 1;
        for (Map.Entry<String, String> entry : lastEntries) {
            byte[] imageBytes = Base64.getDecoder().decode(entry.getValue());
            Path imagePath = tempImageDir.resolve(String.format("frame_%03d.jpg", index++));
            Files.write(imagePath, imageBytes);
        }
    }

    private void saveVideoUrlInRealtimeDB(String downloadUrl) {
        DatabaseReference ref = FirebaseDatabase.getInstance().getReference("videos");
        String key = String.valueOf(System.currentTimeMillis());
        ref.child(key).setValueAsync(Collections.singletonMap("url", downloadUrl));
    }

    private void cleanup() throws IOException {
        FileUtils.deleteDirectory(tempImageDir.toFile());
    }
}

