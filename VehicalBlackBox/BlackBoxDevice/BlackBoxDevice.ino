#include "Wire.h"
#include <MPU6050_light.h>

MPU6050 mpu(Wire);
long timer = 0;

void setup() {
  Serial.begin(9600);
  Wire.begin();
  
  byte status = mpu.begin();
  Serial.print(F("MPU6050 status: "));
  Serial.println(status);
  if(status != 0) {
    Serial.println(F("Error: Could not connect to MPU6050. Halting execution."));
    while(1) { // stop execution
      delay(1000); 
    }
  }
  
  Serial.println(F("Calculating offsets, do not move MPU6050"));
  delay(1000);
  mpu.calcOffsets(true,true); // gyro and accelero
  Serial.println("Done!\n");
}

void loop() {
  mpu.update();

  if(millis() - timer > 10){ // print data 
    Serial.print("Temp :");Serial.print(mpu.getTemp());
    Serial.print(F("ACCELERO  X: "));Serial.print(mpu.getAccX());
    Serial.print("\tY: ");Serial.print(mpu.getAccY());
    Serial.print("\tZ: ");Serial.println(mpu.getAccZ());
      
    Serial.print(F("ANGLE     X: "));Serial.print(mpu.getAngleX());
    Serial.print("\tY: ");Serial.print(mpu.getAngleY());
    Serial.print("\tZ: ");Serial.println(mpu.getAngleZ());
    Serial.println(F("=====================================================\n"));
    timer = millis();
  }
}