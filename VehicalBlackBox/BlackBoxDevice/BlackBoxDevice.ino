#include <Wire.h>
#include <MPU6050_light.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// Device name
const char* deviceId = "ESP12E_001";

// Default values
int fireStatus = 0;
String lat = "waiting-gps";
String lng = "waiting-gps";
String speed = "waiting-gps";

// Wi-Fi Credentials
#define WIFI_SSID "POCO M3"
#define WIFI_PASSWORD "12345678"

// Firebase Config

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;
FirebaseJson json;

// Fire Sensor Pin
const int FIRE_SENSOR_PIN = D5;

// MPU6050 Setup
MPU6050 mpu(Wire);
unsigned long sensorTimer = 0;
unsigned long lastFirebaseSendTime = 0; // Timer for sending Firebase every 1s

// NTP Setup
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 19800, 60000); // GMT+5:30

// GPS Setup
TinyGPSPlus gps;
SoftwareSerial gpsSerial(D6, D7); // RX, TX

String getISOTime() {
  time_t rawTime = timeClient.getEpochTime();
  struct tm* timeInfo = gmtime(&rawTime);

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
  gpsSerial.begin(9600);
  Wire.begin();
  pinMode(FIRE_SENSOR_PIN, INPUT);

  // WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to Wi-Fi!");
  WiFi.setSleepMode(WIFI_LIGHT_SLEEP);

  // NTP
  timeClient.begin();
  while (!timeClient.update()) timeClient.forceUpdate();

  // Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  // Log startup
  /*
  String dateTime = getISOTime();
  if (Firebase.setString(firebaseData, "/event/" + dateTime, "Device started")) {
    Serial.println("Firebase message sent!");
  } else {
    Serial.print("Firebase error: ");
    Serial.println(firebaseData.errorReason());
  }*/

  // MPU6050 Init
  byte status = mpu.begin();
  Serial.print(F("MPU6050 status: "));
  Serial.println(status);
  while (status != 0) {
    Serial.println("MPU6050 failed. Retrying in 2 seconds...");
    delay(2000);
    status = mpu.begin();
  }
  Serial.println(F("Calculating offsets... Don't move MPU6050"));
  delay(1000);
  mpu.calcOffsets(true, true);
  Serial.println("MPU6050 Ready!\n");

  Serial.println("GPS is Connecting to satellites...");
}

void loop() {
  mpu.update();

  // Sensor read every 10 ms
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

    fireStatus = (digitalRead(FIRE_SENSOR_PIN) == LOW) ? 1 : 0;

    sensorTimer = millis();
  }

  // GPS Handling
  while (gpsSerial.available()) {
    char c = gpsSerial.read();
    gps.encode(c);

    if (gps.location.isUpdated()) {
      lat = String(gps.location.lat(), 6);
      lng = String(gps.location.lng(), 6);
      speed = String(gps.speed.kmph());

      Serial.print("Latitude: "); Serial.print(lat);
      Serial.print(" Longitude: "); Serial.print(lng);
      Serial.print(" Speed: "); Serial.print(speed); Serial.println(" km/h");
    }
  }

  // Send data to Firebase every 1 second
  if (millis() - lastFirebaseSendTime >= 1000) {
    timeClient.update();
    sendDataToFirebase();
    lastFirebaseSendTime = millis();
  }
}

void sendDataToFirebase() {
  json.clear(); // clear previous JSON

  json.set("deviceId", deviceId);
  json.set("fireStatus", fireStatus);

  // gforces
  FirebaseJson gforces;
  gforces.set("X", String(mpu.getAccX()));
  gforces.set("Y", String(mpu.getAccY()));
  gforces.set("Z", String(mpu.getAccZ()));
  json.set("gforces", gforces);

  // gyro
  FirebaseJson gyro;
  gyro.set("X", String(mpu.getGyroX()));
  gyro.set("Y", String(mpu.getGyroY()));
  gyro.set("Z", String(mpu.getGyroZ()));
  json.set("gyro", gyro);

  // location
  FirebaseJson gpsjson;
  gpsjson.set("lat", lat);
  gpsjson.set("lng", lng);
  json.set("location", gpsjson);

  json.set("speed", speed);
  json.set("address", "");
  json.set("status", "");

  String dateTime = getISOTime();
  String path = "/event/" + dateTime;

  if (Firebase.setJSON(firebaseData, path, json)) {
    Serial.println("Data sent successfully");
  } else {
    Serial.print("Firebase send error: ");
    Serial.println(firebaseData.errorReason());
  }
}