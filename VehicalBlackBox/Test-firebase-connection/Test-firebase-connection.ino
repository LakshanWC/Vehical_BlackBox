#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>

#define WIFI_SSID "POCO M3"
#define WIFI_PASSWORD "12345678"

#define FIREBASE_HOST "----------------------"
#define FIREBASE_AUTH "----------------------"

FirebaseData firebaseData;
FirebaseConfig config;
FirebaseAuth auth;

void setup() {
  Serial.begin(9600);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println(" connected!");

  // Configure Firebase
  config.host = FIREBASE_HOST;
  config.signer.tokens.legacy_token = FIREBASE_AUTH;
  
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);

  if (Firebase.setString(firebaseData, "/message", "Hello, world")) {
    Serial.println("Message sent!");
  } else {
    Serial.print("Firebase error: ");
    Serial.println(firebaseData.errorReason());
  }
}

void loop() {
}