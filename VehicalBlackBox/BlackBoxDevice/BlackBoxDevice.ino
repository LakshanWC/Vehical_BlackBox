#include <Wire.h>
#include <MPU6050_light.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <NTPClient.h>
#include <WiFiUdp.h>

// Wi-Fi Credentials 
#define WIFI_SSID "POCO M3"
#define WIFI_PASSWORD "12345678"

// Firebase Config 
#define FIREBASE_HOST "------------------"       
#define FIREBASE_AUTH "-------------------"                    

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

// Fire Sensor Pin D5
const int FIRE_SENSOR_PIN = D5;

// MPU6050 Setup 
MPU6050 mpu(Wire);
unsigned long sensorTimer = 0;

// NTP Setup
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // 19800 = GMT+5:30 for Sri Lanka

String getISOTime() {
  time_t rawTime = timeClient.getEpochTime();
  struct tm* timeInfo = gmtime(&rawTime); // Get UTC time

  char buffer[25];
  sprintf(buffer, "%04d-%02d-%02dT%02d:%02d:%02dZ", 
          timeInfo->tm_year + 1900,
          timeInfo->tm_mon + 1,
          timeInfo->tm_mday,
          timeInfo->tm_hour,
          timeInfo->tm_min,
          timeInfo->tm_sec);

  return String(buffer);
}

void setup() {
  Serial.begin(9600);
  Wire.begin();
  pinMode(FIRE_SENSOR_PIN, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");

  // Start NTP
  timeClient.begin();
  while (!timeClient.update()) {
    timeClient.forceUpdate();
  }

  // Firebase configuration
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Get current time in ISO format
  String dateTime = getISOTime();

  // Send to Firebase under /event/<timestamp>
  if (Firebase.setString(firebaseData, "/event/" + dateTime, "Device started")) {
    Serial.println("Firebase message sent!");
  } else {
    Serial.print("Firebase error: ");
    Serial.println(firebaseData.errorReason());
  }

  // Initialize MPU6050
  byte status = mpu.begin();
  Serial.print(F("MPU6050 status: "));
  Serial.println(status);
  while (status != 0) {
    Serial.println("MPU6050 failed to initialize. Retrying in 2 seconds...");
    delay(2000);
    status = mpu.begin(); // Retry
    Serial.print(F("MPU6050 status: "));
    Serial.println(status);
  }

  Serial.println(F("Calculating offsets, do not move MPU6050"));
  delay(1000);
  mpu.calcOffsets(true, true);
  Serial.println("Done!\n");
}

void loop() {
  mpu.update();

  if ((millis() - sensorTimer) > 10) {
    float angleX = mpu.getAngleX();
    float angleY = mpu.getAngleY();
    float angleZ = mpu.getAngleZ();

    float accX = mpu.getAccX();
    float accY = mpu.getAccY();
    float accZ = mpu.getAccZ();

    Serial.print("Angle X: "); Serial.print(angleX);
    Serial.print("\tY: "); Serial.print(angleY);
    Serial.print("\tZ: "); Serial.println(angleZ);

    Serial.print("Accel X: "); Serial.print(accX);
    Serial.print("\tY: "); Serial.print(accY);
    Serial.print("\tZ: "); Serial.println(accZ);

    // Fire detection
    if (digitalRead(FIRE_SENSOR_PIN) == LOW) {
      Serial.println("🔥 Fire Detected!");
    }

    sensorTimer = millis();
  }
  timeClient.update();
  delay(1);
}