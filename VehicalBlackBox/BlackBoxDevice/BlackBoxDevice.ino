#include <Wire.h>
#include <MPU6050.h>
#include <MPU6050_light.h>

// Code 1 objects and variables
MPU6050 mpu1;
int16_t ax, ay, az;
float gForceX, gForceY, gForceZ;
float offsetX = 0, offsetY = 0, offsetZ = 0;

// Code 2 objects and variables
MPU6050 mpu2(Wire);
unsigned long timer = 0;

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // --- Code 1 MPU Initialization ---
  mpu1.initialize();
  if (!mpu1.testConnection()) {
    Serial.println("MPU6050 #1 connection failed!");
    while (1);
  }
  Serial.println("MPU6050 #1 connected!");
  calibrateSensor();
  Serial.println("Calibration complete. Starting readings...");
  Serial.println("X(g)\tY(g)\tZ(g)");

  // --- Code 2 MPU Initialization ---
  byte status = mpu2.begin();
  Serial.print(F("MPU6050 #2 status: "));
  Serial.println(status);
  while (status != 0) { }  // halt if connection fails
  Serial.println(F("Calculating offsets for MPU6050 #2, do not move"));
  delay(1000);
  // mpu2.upsideDownMounting = true;
  mpu2.calcOffsets();
  Serial.println("Done with offsets for MPU6050 #2\n");
}

void loop() {
  // --- Code 1: G-force calculation ---
  mpu1.getAcceleration(&ax, &ay, &az);
  gForceX = (ax / 16384.0) - offsetX;
  gForceY = (-ay / 16384.0) - offsetY;
  gForceZ = (az / 16384.0) - offsetZ;

  if (abs(gForceX) < 0.05) gForceX = 0.0;
  if (abs(gForceY) < 0.05) gForceY = 0.0;
  if (abs(gForceZ) < 0.05) gForceZ = 0.0;

  Serial.print("G-Force => X: ");
  Serial.print(gForceX, 2);
  Serial.print("\tY: ");
  Serial.print(gForceY, 2);
  Serial.print("\tZ: ");
  Serial.println(gForceZ, 2);

  // --- Code 2: Angle estimation ---
  mpu2.update();
  if ((millis() - timer) > 10) {
    Serial.print("Angle => X: ");
    Serial.print(mpu2.getAngleX());
    Serial.print("\tY: ");
    Serial.print(mpu2.getAngleY());
    Serial.print("\tZ: ");
    Serial.println(mpu2.getAngleZ());
    timer = millis();
  }

  delay(100); // delay between G-force reads
}

void calibrateSensor() {
  const int samples = 100;
  float sumX = 0, sumY = 0, sumZ = 0;

  Serial.println("Calibrating MPU6050 #1... Keep sensor still and flat");

  for (int i = 0; i < samples; i++) {
    mpu1.getAcceleration(&ax, &ay, &az);
    sumX += ax / 16384.0;
    sumY += -ay / 16384.0;
    sumZ += az / 16384.0;
    delay(10);
  }

  offsetX = sumX / samples;
  offsetY = sumY / samples;
  offsetZ = (sumZ / samples) - 1.0;

  Serial.print("Offsets - X: ");
  Serial.print(offsetX, 4);
  Serial.print(" Y: ");
  Serial.print(offsetY, 4);
  Serial.print(" Z: ");
  Serial.println(offsetZ, 4);
}
