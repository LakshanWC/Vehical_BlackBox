# Vehicle Black Box 🚗📦  

An **IoT-powered Vehicle Black Box** that monitors crashes, fires, and driving data in real-time. Inspired by aircraft black boxes, this system records key sensor data and can help in **accident analysis, safety monitoring, and emergency response**.  
---
[Project Structure](https://gitdocs1.s3.amazonaws.com/digests/lakshanwc-vehical_blackbox/cbe20395-2fe9-4944-9195-e0faa210f952.txt)
---

## 🔧 Features  
- 📡 Real-time data logging using **ESP8266/ESP32**  
- 📍 **GPS tracking** (location, speed, time)  
- 📉 **Crash detection** with **MPU6050 accelerometer & gyroscope**  
- 🔥 **Fire detection sensor** integration  
- 🎤 **Video recording** of the last few minutes before a crash 
- ☁️ **Firebase integration** for cloud storage  
- 📊 **Accident alerts & analytics** via backend/visualization tools  

---

## 🛠️ Hardware Requirements  
- ESP8266 / ESP32 / ESP32-CAM  
- MPU6050 (Accelerometer + Gyroscope)  
- NEO-6M GPS Module  
- Fire Sensor  
- 
- Power Supply (Car battery or USB)  

---

## 💻 Software Requirements  
- Arduino IDE / PlatformIO  
- Firebase Realtime Database / Firestore  
- Python / Java / Spring Boot backend *(for data processing & video reconstruction)*  
- React Frontend *(visualization)*  

---

## 📡 System Architecture  
1. **ESP Board** collects sensor data  
2. Data packaged into **JSON** and sent to **Firebase**  
3. Backend service processes and analyzes data  
4. Frontend app/dashboard visualizes vehicle health and accident logs  

---
