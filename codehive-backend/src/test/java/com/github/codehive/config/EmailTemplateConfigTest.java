package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.MapPropertySource;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.spring6.SpringTemplateEngine;

import com.github.codehive.notification.EmailTemplateRenderer;
import com.github.codehive.notification.NotificationEmailContent;

class EmailTemplateConfigTest {
    private final EmailTemplateRenderer renderer = new EmailTemplateRenderer(
            new EmailTemplateConfig().emailTemplateEngine(), "https://codehive.example");

    @Test
    void rendersBrandedNotificationAsHtmlAndPlainText() {
        NotificationEmailContent content = new NotificationEmailContent(
                "New assignment",
                "NEW ASSIGNMENT",
                "Arrays are now available",
                "A new programming exercise was published.",
                "Assignment details",
                List.of("Group: Algorithms", "Due: July 25"),
                "Open assignment",
                "https://codehive.example/assignment/1");

        var rendered = renderer.renderNotification(content);

        assertThat(rendered.html())
                .contains("Code<span")
                .contains("Arrays are now available")
                .contains("background:#00509D");
        assertThat(rendered.text())
                .contains("NEW ASSIGNMENT")
                .contains("Group: Algorithms")
                .contains("Manage notification preferences");
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
