package com.example.iot_backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.example.iot_backend.service.EmailService;

@RestController
@RequestMapping("/test")
public class TestController {

    @Autowired
    private EmailService emailService;

    @GetMapping("/send-test-email")
    public String sendTestEmail() {
        try {
            emailService.sendEmergencyAlert(
                    "thisismysampleacc01@gmail.com",  // Replace with your email
                    "TEST: Accident Detection System",
                    "This is a test email from your backend."
            );
            return "Test email sent successfully!";
        } catch (Exception e) {
            return "Failed to send email: " + e.getMessage();
        }
    }
}