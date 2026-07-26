package com.github.codehive.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

import com.github.codehive.notification.EmailTemplateRenderer;
import com.github.codehive.notification.NotificationEmailContent;

class EmailTemplateConfigTest {
    @Test
    void rendersBrandedNotificationAsHtmlAndPlainText() {
        EmailTemplateRenderer renderer = new EmailTemplateRenderer(
                new EmailTemplateConfig().emailTemplateEngine(), "https://codehive.example");
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
}
