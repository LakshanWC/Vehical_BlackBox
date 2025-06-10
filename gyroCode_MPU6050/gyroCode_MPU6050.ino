#include<Wire.h>
#include<MPU6050.h>

const bool mpuCalibration = false;
const int sampleSize = 2000; //change this value to change the MPU6050 calibration sample size;

float gyroXoffset = 0;
float gyroYoffset = 0;
float gyroZoffset = 0;

static float pitch = 0;
static float roll = 0;
static float yaw = 0;

MPU6050 mpu;

int16_t gx,gy,gz;
int16_t ax,ay,az;
int16_t tempRaw;



unsigned long previousTime = millis();

void setup() {
  Serial.begin(9600);
  Wire.begin(D2,D1);

  Serial.print("Initializing MPU-6050");
  mpu.initialize();

  if(mpu.testConnection()){
    Serial.println("MPU-6050 connected...");
  }
  else{
    Serial.println("Faild to connect to MPU-6050");
    while(1); //do nothing if faild to connect to mpu6050
  }

  calibrateMPU6050Offset();

}

void loop() {

  mpu.getAcceleration(&ax, &ay, &az);
  mpu.getRotation(&gx, &gy, &gz);
  tempRaw = mpu.getTemperature();

  convertRawGyroValues(ax,ay,az,gx,gy,gz,tempRaw);

  //delay(500);
}
void convertRawGyroValues(int16_t ax, int16_t ay, int16_t az, int16_t gx, int16_t gy, int16_t gz, int16_t tempRaw){

  //calculate delta
  unsigned long currentTime = millis();
  float deltaTime = (currentTime - previousTime)/1000.0;
  previousTime = currentTime;

  // 1g = 16384 raw units
  float accX = ax / 16384.0;
  float accY = ay / 16384.0;
  float accZ = az / 16384.0;

  // 1°/s = 131 raw units
  float gyroX = (gx - gyroXoffset)/ 131.0;
  float gyroY = (gy - gyroYoffset) / 131.0;
  float gyroZ = (gz - gyroZoffset) / 131.0;

  float temp = (tempRaw / 340.0) + 36.53;

  //anguler velocity overtime
  pitch += gyroY * deltaTime;
  roll += gyroX * deltaTime;
  yaw += gyroZ * deltaTime;

/*
  Serial.println("-------- Accelerometer --------");
  Serial.print("X: "); Serial.print(accX, 2); Serial.print("   ");
  Serial.print("Y: "); Serial.print(accY, 2); Serial.print("   ");
  Serial.print("Z: "); Serial.println(accZ, 2);*/

 // Serial.println("----------- Gyro --------------");
  Serial.print("X: "); Serial.print(roll, 2); Serial.print("       ");
  Serial.print("Y: "); Serial.print(pitch, 2); Serial.print("       ");
  Serial.print("Z: "); Serial.println(yaw, 2);
/*
  Serial.println("----------- Temp --------------");
  Serial.print("Temperature: ");
  Serial.print(temp, 2);
  Serial.println(" °C");*/
}

void calibrateMPU6050Offset(){
  Serial.println("Calibraiting MPU6050 DO NOT MOVE the device ......!! ");
  long sumX =0,sumY=0,sumZ=0;
  for(int count = 0 ;count < sampleSize ; count ++){
    mpu.getRotation(&gx, &gy, &gz);
    sumX += gx;
    sumY += gy;
    sumZ += gz;
  }
  gyroXoffset = (float)sumX/sampleSize;
  gyroYoffset = (float)sumY/sampleSize;
  gyroZoffset = (float)sumZ/sampleSize;
  Serial.println("Calibration Complete ....!!! ");
}
