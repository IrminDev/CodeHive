package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.core.env.MapPropertySource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import com.github.codehive.config.AsyncConfig;
import com.github.codehive.notification.EmailTemplateRenderer;

import jakarta.mail.internet.MimeMessage;

class MailSenderServiceAsyncTest {
    @Test
    void sendsWelcomeEmailOutsideTheCallingThread() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        CompletableFuture<String> sendingThread = new CompletableFuture<>();

        when(mailSender.createMimeMessage())
                .thenAnswer(invocation -> new JavaMailSenderImpl().createMimeMessage());
        when(renderer.render(eq("welcome"),
                org.mockito.ArgumentMatchers.<Map<String, Object>>any()))
                .thenReturn(new EmailTemplateRenderer.RenderedEmail(
                        "Plain-text welcome", "<html><body>HTML welcome</body></html>"));
        doAnswer(invocation -> {
            sendingThread.complete(Thread.currentThread().getName());
            return null;
        }).when(mailSender).send(any(MimeMessage.class));

        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("test", Map.of(
                            "frontend.url", "https://codehive.example",
                            "spring.mail.username", "noreply@codehive.example")));
            context.registerBean(JavaMailSender.class, () -> mailSender);
            context.registerBean(EmailTemplateRenderer.class, () -> renderer);
            context.register(AsyncConfig.class, MailSenderService.class);
            context.refresh();

            String callerThread = Thread.currentThread().getName();
            context.getBean(MailSenderService.class).sendWelcomeEmail(
                    "ada@example.com", "Ada", "temporary-password");

            assertThat(sendingThread.get(2, TimeUnit.SECONDS))
                    .startsWith("welcome-email-")
                    .isNotEqualTo(callerThread);
        }
    }

    @Test
    void sendsPasswordResetEmailOutsideTheCallingThread() throws Exception {
        JavaMailSender mailSender = mock(JavaMailSender.class);
        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        CompletableFuture<String> sendingThread = new CompletableFuture<>();

        when(mailSender.createMimeMessage())
                .thenAnswer(invocation -> new JavaMailSenderImpl().createMimeMessage());
        when(renderer.render(eq("password-reset"),
                org.mockito.ArgumentMatchers.<Map<String, Object>>any()))
                .thenReturn(new EmailTemplateRenderer.RenderedEmail(
                        "Plain-text reset", "<html><body>HTML reset</body></html>"));
        doAnswer(invocation -> {
            sendingThread.complete(Thread.currentThread().getName());
            return null;
        }).when(mailSender).send(any(MimeMessage.class));

        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("test", Map.of(
                            "frontend.url", "https://codehive.example",
                            "spring.mail.username", "noreply@codehive.example")));
            context.registerBean(JavaMailSender.class, () -> mailSender);
            context.registerBean(EmailTemplateRenderer.class, () -> renderer);
            context.register(AsyncConfig.class, MailSenderService.class);
            context.refresh();

            String callerThread = Thread.currentThread().getName();
            context.getBean(MailSenderService.class).sendPasswordResetEmail(
                    "ada@example.com", "reset-token-123");

            assertThat(sendingThread.get(2, TimeUnit.SECONDS))
                    .startsWith("welcome-email-")
                    .isNotEqualTo(callerThread);
        }
    }
}
