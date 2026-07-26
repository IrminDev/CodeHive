package com.github.codehive.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.github.codehive.notification.EmailTemplateRenderer;
import com.github.codehive.notification.NotificationEmailContent;

@Service
public class MailSenderService{
    private static final Logger LOGGER = LoggerFactory.getLogger(MailSenderService.class);

    @Value("${frontend.url}")
    private String frontendUrl;

    @Value("${spring.mail.username}")
    private String fromEmail;

    private final JavaMailSender javaMailSender;
    private final EmailTemplateRenderer templateRenderer;

    public MailSenderService(JavaMailSender javaMailSender, EmailTemplateRenderer templateRenderer) {
        this.javaMailSender = javaMailSender;
        this.templateRenderer = templateRenderer;
    }

    public void sendPasswordResetEmail(String to, String token) {
        String subject = "Reset your CodeHive password";
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        EmailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(
                "password-reset", java.util.Map.of("resetUrl", resetUrl));
        sendMimeMessage(to, subject, rendered);
    }

    @Async("welcomeEmailExecutor")
    public void sendWelcomeEmail(String to, String name, String temporaryPassword) {
        try {
            String subject = "Welcome to CodeHive";
            EmailTemplateRenderer.RenderedEmail rendered = templateRenderer.render(
                    "welcome", java.util.Map.of(
                            "name", name,
                            "email", to,
                            "temporaryPassword", temporaryPassword,
                            "loginUrl", frontendUrl + "/login"));
            sendMimeMessage(to, subject, rendered);
        } catch (RuntimeException exception) {
            LOGGER.error("Failed to send welcome email to {}", to, exception);
        }
    }

    public void sendNotificationEmail(String to, NotificationEmailContent content) {
        sendMimeMessage(to, content.subject(), templateRenderer.renderNotification(content));
    }

    public void sendTestNotificationEmail(String to, String name) {
        NotificationEmailContent content = new NotificationEmailContent(
                "Your CodeHive notifications are ready",
                "TEST EMAIL",
                "Email notifications are working",
                "Hi " + name + ", this message confirms that CodeHive can send notifications to your account.",
                "Current defaults",
                java.util.List.of("Language: English", "Timezone: America/Mexico_City"),
                "Open CodeHive",
                frontendUrl);
        sendNotificationEmail(to, content);
    }

    @Deprecated
    public void sendSimpleMessage(String to, String subject, String text) {
        sendMimeMessage(to, subject, new EmailTemplateRenderer.RenderedEmail(
                "<html><body><p>" + org.springframework.web.util.HtmlUtils.htmlEscape(text)
                        .replace("\n", "<br>") + "</p></body></html>",
                text));
    }

    private void sendMimeMessage(String to, String subject, EmailTemplateRenderer.RenderedEmail rendered) {
        try {
            jakarta.mail.internet.MimeMessage message = javaMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                    message, true, java.nio.charset.StandardCharsets.UTF_8.name());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom(fromEmail);
            helper.setText(rendered.text(), rendered.html());
            javaMailSender.send(message);
        } catch (jakarta.mail.MessagingException exception) {
            throw new IllegalStateException("Failed to create email message", exception);
        }
    }
}
