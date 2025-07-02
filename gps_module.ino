 #include <TinyGPS++.h>

TinyGPSPlus gps;

void setup() {
  Serial.begin(9600); 
  Serial.println("GPS is Conecting to satallites...");
}

void loop() {

  while (Serial.available()) {

    int data = Serial.read();
    
    if (gps.encode(data)) {
      
      if (gps.location.isValid()) {
        Serial.print("Latitude: ");
        Serial.print(gps.location.lat(),6);
        Serial.print(" Longitude: ");
        Serial.println(gps.location.lng(),6);
        Serial.print("Speed:");
        Serial.print(gps.speed.kmph());
        Serial.println(" km/h");
        Serial.print("Satallite Count: ");
        Serial.println(gps.satellites.value());
      } else {
        Serial.println("GPS location not valid yet...");
      }
    }
  }
}
