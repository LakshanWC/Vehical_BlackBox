package com.example.iot_backend.service;

import org.json.JSONObject;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.Scanner;

@Service
public class GeocodingService {

    // Using OpenStreetMap Nominatim (free)
    public String reverseGeocode(String lat, String lng) throws IOException {
        String url = "https://nominatim.openstreetmap.org/reverse?format=json&lat=" + lat + "&lon=" + lng;
        HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
        conn.setRequestMethod("GET");
        conn.setRequestProperty("User-Agent", "AccidentDetectionSystem/1.0");

        if (conn.getResponseCode() == 200) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
            StringBuilder response = new StringBuilder();
            String line;

            while ((line = reader.readLine()) != null) {
                response.append(line);
            }
            reader.close();

            // Parse the JSON response
            JSONObject json = new JSONObject(response.toString());

            // Extract the formatted address
            if (json.has("display_name")) {
                return json.getString("display_name");
            } else if (json.has("address")) {
                JSONObject address = json.getJSONObject("address");
                // Build address from components
                return String.format("%s, %s, %s",
                        address.optString("road", ""),
                        address.optString("city", address.optString("village", "")),
                        address.optString("country", "")
                ).replaceAll(", ,", ",").trim();
            }
        }
        return null;
    }
    public String reverseGeocodeWithRetry(String lat, String lng, int maxRetries) {
        int attempts = 0;
        while (attempts < maxRetries) {
            try {
                String result = reverseGeocode(lat, lng);
                if (result != null) return result;
            } catch (Exception e) {
                System.err.println("Attempt " + (attempts+1) + " failed: " + e.getMessage());
            }
            attempts++;
            try { Thread.sleep(1000); } catch (InterruptedException ie) {}
        }
        return null;
    }
}