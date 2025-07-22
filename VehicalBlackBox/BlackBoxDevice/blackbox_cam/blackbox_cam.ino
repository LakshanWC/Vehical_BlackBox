#include "esp_camera.h"
#include <WiFi.h>
#include <base64.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <time.h>

// ==== WiFi credentials ====
const char* ssid = "POCO M3";
const char* password = "12345678";

// ==== Firebase Realtime DB config ====
const char* FIREBASE_HOST = "blackboxcam-5be85-default-rtdb.asia-southeast1.firebasedatabase.app";
const char* FIREBASE_SECRET = "FiPDUWOewURdhB9wEphFfFd7NMDTO28LaGY7LvLA";

// ==== NTP time config ====
const char* ntpServer = "pool.ntp.org";
const long gmtOffset_sec = 0;
const int daylightOffset_sec = 0;

// ==== Camera pin config for AI Thinker ====
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

void startCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  config.fb_location = CAMERA_FB_IN_PSRAM;
  config.grab_mode = CAMERA_GRAB_LATEST;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QQVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x\n", err);
    while (true) { delay(1000); }
  }

  sensor_t *s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_QVGA);
}

String getUTCtimestamp() {
  struct tm timeinfo;
  if (!getLocalTime(&timeinfo)) {
    Serial.println("Failed to obtain time");
    return "1970-01-01T00:00:00Z";
  }
  char timeStr[25];
  strftime(timeStr, sizeof(timeStr), "%Y-%m-%dT%H:%M:%SZ", &timeinfo);
  return String(timeStr);
}

void uploadToFirebase(const String& base64Image, const String& timestamp) {
  WiFiClientSecure client;
  HTTPClient http;
  
  // Configure WiFiClientSecure for Firebase
  client.setInsecure(); // Bypass certificate verification (for testing only)
  
  // Construct Firebase URL
  String url = "https://" + String(FIREBASE_HOST) + "/images/" + timestamp + ".json?auth=" + String(FIREBASE_SECRET);
  
  http.begin(client, url);
  http.addHeader("Content-Type", "application/json");
  
  String jsonPayload = "{\"image\":\"" + base64Image + "\"}";
  
  int httpCode = http.PUT(jsonPayload);
  
  if (httpCode > 0) {
    if (httpCode == HTTP_CODE_OK) {
      String payload = http.getString();
      Serial.println(payload);
    }
  } else {
    Serial.printf("[HTTP] POST... failed, error: %s\n", http.errorToString(httpCode).c_str());
  }
  
  http.end();
}

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
  WiFi.setSleep(true);
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Initialize time
  configTime(gmtOffset_sec, daylightOffset_sec, ntpServer);

  // Initialize camera
  startCamera();
  Serial.println("Camera initialized");
}

void loop() {
  // Capture photo
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    delay(3000);
    return;
  }

  // Convert to base64
  String imageBase64 = base64::encode(fb->buf, fb->len);
  esp_camera_fb_return(fb);

  // Get timestamp
  String timestamp = getUTCtimestamp();

  // Upload to Firebase
  uploadToFirebase(imageBase64, timestamp);

  delay(3000); // Wait 3 seconds before next capture
}