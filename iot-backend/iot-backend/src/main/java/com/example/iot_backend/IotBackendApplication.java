package com.example.iot_backend;

import com.example.iot_backend.service.FirebaseInitializer;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.io.InputStream;

@SpringBootApplication
public class IotBackendApplication {

	@Autowired
	private FirebaseInitializer initializer;

	public static void main(String[] args) {
		SpringApplication.run(IotBackendApplication.class, args);
	}

	@PostConstruct
	public void checkPath() {
		System.out.println("Firebase configuration path: " + initializer.getServiceAccountPath());

		// Check if we can load the resource from classpath
		try {
			InputStream resourceStream = getClass().getClassLoader()
					.getResourceAsStream("vehicalblackbox-firebase-adminsdk-fbsvc-b7b5ed4693.json");

			if (resourceStream != null) {
				System.out.println("Successfully loaded Firebase credentials from classpath");
				resourceStream.close();
			} else {
				System.out.println("Failed to load Firebase credentials from classpath");
			}
		} catch (IOException e) {
			System.out.println("Error verifying Firebase credentials: " + e.getMessage());
		}
	}
}