package com.github.codehive.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.test.util.ReflectionTestUtils;

import com.github.codehive.notification.EmailTemplateRenderer;

import jakarta.mail.Multipart;
import jakarta.mail.Part;
import jakarta.mail.internet.MimeMessage;

class MailSenderServiceTest {
    private JavaMailSender mailSender;
    private MailSenderService service;
    private MimeMessage message;

    @BeforeEach
    void setUp() {
        mailSender = mock(JavaMailSender.class);
        message = new JavaMailSenderImpl().createMimeMessage();
        when(mailSender.createMimeMessage()).thenReturn(message);

        EmailTemplateRenderer renderer = mock(EmailTemplateRenderer.class);
        when(renderer.render("welcome", Map.of(
                "name", "Ada",
                "email", "ada@example.com",
                "temporaryPassword", "temporary-password",
                "loginUrl", "https://codehive.example/login")))
                .thenReturn(new EmailTemplateRenderer.RenderedEmail(
                        "Plain-text welcome", "<html><body>HTML welcome</body></html>"));

        service = new MailSenderService(mailSender, renderer);
        ReflectionTestUtils.setField(service, "frontendUrl", "https://codehive.example");
        ReflectionTestUtils.setField(service, "fromEmail", "noreply@codehive.example");
    }

    @Test
    void sendsWelcomeEmailAsMultipartAlternative() throws Exception {
        service.sendWelcomeEmail("ada@example.com", "Ada", "temporary-password");
        message.saveChanges();

        verify(mailSender).send(message);
        assertThat(message.getContentType()).startsWith("multipart/");
        assertThat(containsMimeType(message, "text/plain")).isTrue();
        assertThat(containsMimeType(message, "text/html")).isTrue();
    }

    @Test
    void logsWelcomeEmailFailureWithoutFailingRegistrationCaller() {
        doThrow(new MailSendException("SMTP unavailable")).when(mailSender).send(message);

        assertThatCode(() -> service.sendWelcomeEmail(
                "ada@example.com", "Ada", "temporary-password"))
                .doesNotThrowAnyException();
    }

    private boolean containsMimeType(Part part, String mimeType) throws Exception {
        if (part.isMimeType(mimeType)) {
            return true;
        }
        Object content = part.getContent();
        if (!(content instanceof Multipart multipart)) {
            return false;
        }
        for (int index = 0; index < multipart.getCount(); index++) {
            if (containsMimeType(multipart.getBodyPart(index), mimeType)) {
                return true;
            }
        }
        return false;
    }
}
