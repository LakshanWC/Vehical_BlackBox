#include<Wire.h>
#include<MPU6050.h>

#define bool mpuCalibration = false;
#define sampleCount = 2000; //change this value to change the MPU6050 calibration sample size;
#define gyroXoffset = 0;
#define gyroYoffset = 0;
#define gyroZoffset = 0;

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
    while(1);
  }

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
  float gyroX = gx / 131.0;
  float gyroY = gy / 131.0;
  float gyroZ = gz / 131.0;

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
  long sumX =0,sumY=0,sumZ=0;
  for(int count = 0 ;count < sampleCount ; count ++){
    mpu.getRotation(&gx, &gy, &gz);
    sumX += gx;
    sumY += gy;
    sumZ += gz;
  }
  gyroXoffset = sumX/200
}
