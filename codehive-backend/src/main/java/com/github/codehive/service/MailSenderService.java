package com.github.codehive.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;

@Service
public class MailSenderService{

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final JavaMailSender javaMailSender;

    public MailSenderService(JavaMailSender javaMailSender) {
        this.javaMailSender = javaMailSender;
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Solicitud de recuperación de contraseña";
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        String message = """
                Hola,
                
                Has solicitado recuperar tu contraseña. 
                Usa el siguiente enlace de recuperación:
                
                %s
                
                Este código expirará en 15 minutos.
                
                Si no solicitaste este cambio, ignora este correo.
                """.formatted(resetUrl);

        sendSimpleMessage(to, subject, message);
    }

    public void sendSimpleMessage(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom(fromEmail);
        javaMailSender.send(message);
    }
}
