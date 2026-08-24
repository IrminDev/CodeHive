package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.github.codehive.notification.EmailTemplateRenderer;
import com.github.codehive.model.enums.NotificationType;
import com.github.codehive.notification.NotificationCallout;
import com.github.codehive.notification.NotificationEmailContent;
import com.github.codehive.notification.NotificationFact;

class EmailTemplateConfigTest {
    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer(
            new EmailTemplateConfig().emailTemplateEngine(), "https://codehive.example");

    @Test
    void rendersBrandedNotificationAsHtmlAndPlainText() {
        NotificationEmailContent content = new NotificationEmailContent(
                NotificationType.ASSIGNMENT_PUBLISHED,
                "New assignment",
                "A new programming exercise was published.",
                java.util.List.of(
                        new NotificationFact("Group", "Algorithms"),
                        new NotificationFact("Due", "July 25")),
                null,
                "Open assignment",
                "https://codehive.example/assignment/1");

        var rendered = renderer.renderNotification(content);

        assertThat(rendered.html())
                .contains("Code<span")
                .contains("New assignment available")
                .contains("background:#00509D");
        assertThat(rendered.text())
                .contains("NEW ASSIGNMENT")
                .contains("Group", "Algorithms")
                .contains("Manage notification preferences");
    }

    @ParameterizedTest
    @EnumSource(NotificationType.class)
    void rendersDedicatedHtmlAndTextTemplateForEveryNotificationType(NotificationType type) {
        var rendered = renderer.renderNotification(new NotificationEmailContent(
                type,
                "Subject",
                "Action-specific summary",
                java.util.List.of(new NotificationFact("Group", "Algorithms")),
                new NotificationCallout("Next step", "Open CodeHive for details."),
                "Open CodeHive",
                "https://codehive.example"));

        assertThat(rendered.html())
                .contains("Action-specific summary", "Algorithms", "Open CodeHive")
                .doesNotContain("Timezone:", "America/Mexico_City", "Not configured");
        assertThat(rendered.text())
                .contains("Action-specific summary", "Algorithms", "Open CodeHive")
                .doesNotContain("Timezone:", "America/Mexico_City", "Not configured");
    }

    @Test
    void rendersConciseTestNotificationWithoutTimezone() {
        var rendered = renderer.render("notifications/test-notification", Map.of(
                "name", "Ada",
                "ctaUrl", "https://codehive.example",
                "ctaLabel", "Open CodeHive"));

        assertThat(rendered.html()).contains("Email notifications are working", "Ada")
                .doesNotContain("Timezone:", "America/Mexico_City");
        assertThat(rendered.text()).contains("Email notifications are working", "Ada")
                .doesNotContain("Timezone:", "America/Mexico_City");
    }

    @Test
    void rendersWelcomeAsHtmlAndPlainText() {
        var rendered = renderer.render("welcome", Map.of(
                "name", "Ada",
                "email", "ada@example.com",
                "temporaryPassword", "temporary-password",
                "loginUrl", "https://codehive.example/login"));

        assertThat(rendered.html()).contains("Welcome to the hive", "ada@example.com");
        assertThat(rendered.text()).contains("Welcome to CodeHive", "ada@example.com");
    }

    @Test
    void rendersPasswordResetAsHtmlAndPlainText() {
        var rendered = renderer.render("password-reset", Map.of(
                "resetUrl", "https://codehive.example/reset-password?token=test-token"));

        assertThat(rendered.html()).contains("Reset your password", "test-token");
        assertThat(rendered.text()).contains("Reset your CodeHive password", "test-token");
    }

    @Test
    void injectsEmailEngineWhenDefaultTemplateEngineAlsoExists() {
        try (var context = new AnnotationConfigApplicationContext()) {
            context.getEnvironment().getPropertySources().addFirst(
                    new MapPropertySource("test", Map.of(
                            "frontend.url", "https://codehive.example")));
            context.register(
                    EmailTemplateConfig.class,
                    EmailTemplateRenderer.class,
                    CompetingTemplateEngineConfig.class);
            context.refresh();

            var rendered = context.getBean(EmailTemplateRenderer.class).render(
                    "welcome", Map.of(
                            "name", "Ada",
                            "email", "ada@example.com",
                            "temporaryPassword", "temporary-password",
                            "loginUrl", "https://codehive.example/login"));

            assertThat(rendered.text()).contains("Welcome to CodeHive", "ada@example.com");
        }
    }

    @Configuration
    static class CompetingTemplateEngineConfig {
        @Bean
        TemplateEngine templateEngine() {
            return new SpringTemplateEngine();
        }
    }
}
