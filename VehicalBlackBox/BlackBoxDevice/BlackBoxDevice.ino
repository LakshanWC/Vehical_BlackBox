#include <Wire.h>
#include <MPU6050_light.h>
#include <ESP8266WiFi.h>

// Wi-Fi credentials
const char* ssid = "SSID";
const char* password = "PASSWORD";

// Fire sensor digital pin (D5 on NodeMCU = GPIO14)
const int FIRE_SENSOR_PIN = D5;

MPU6050 mpu(Wire);
unsigned long timer = 0;

void setup() {
  Serial.begin(9600);
  Wire.begin();

  // Setup fire sensor pin
  pinMode(FIRE_SENSOR_PIN, INPUT);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize MPU6050
  byte status = mpu.begin();
  Serial.print(F("MPU6050 status: "));
  Serial.println(status);
  while (status != 0) {}  // Stop if connection failed

  Serial.println(F("Calculating offsets, do not move MPU6050"));
  delay(1000);
  mpu.calcOffsets(true, true);
  Serial.println("Done!\n");
}

void loop() {
  mpu.update();

  if ((millis() - timer) > 10) {
    Serial.print("X : "); Serial.print(mpu.getAngleX());
    Serial.print("\tY : "); Serial.print(mpu.getAngleY());
    Serial.print("\tZ : "); Serial.println(mpu.getAngleZ());

    Serial.print(F("ACCELERO  X: ")); Serial.print(mpu.getAccX());
    Serial.print("\tY: "); Serial.print(mpu.getAccY());
    Serial.print("\tZ: "); Serial.println(mpu.getAccZ());

    // Fire detection
    if (digitalRead(FIRE_SENSOR_PIN) == LOW) {
      Serial.println("🔥 Fire Detected!");
    }

    timer = millis();
  }

  delay(1);
}
