package com.github.codehive.notification;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class EmailTemplateRenderer {
    private final TemplateEngine templateEngine;
    private final String frontendUrl;

    public EmailTemplateRenderer(
            @Qualifier("emailTemplateEngine") TemplateEngine templateEngine,
            @Value("${frontend.url}") String frontendUrl) {
        this.templateEngine = templateEngine;
        this.frontendUrl = frontendUrl;
        validateNotificationTemplates();
    }

    public RenderedEmail render(String templateName, Map<String, Object> variables) {
        Map<String, Object> model = new HashMap<>(variables);
        model.putIfAbsent("frontendUrl", frontendUrl);
        model.putIfAbsent("preferencesUrl", frontendUrl + "/notifications");
        Context context = new Context(java.util.Locale.US);
        context.setVariables(model);
        return new RenderedEmail(
                templateEngine.process("email/html/" + templateName, context),
                templateEngine.process("email/text/" + templateName, context));
    }

    public RenderedEmail renderNotification(NotificationEmailContent content) {
        ToneStyle tone = tone(content.type());
        Map<String, Object> variables = new HashMap<>();
        variables.put("summary", content.summary());
        variables.put("facts", content.facts());
        variables.put("callout", content.callout());
        variables.put("toneBackground", tone.background());
        variables.put("toneForeground", tone.foreground());
        variables.put("toneBorder", tone.border());
        variables.put("ctaLabel", content.ctaLabel());
        variables.put("ctaUrl", content.ctaUrl());
        return render(templateName(content.type()), variables);
    }

    private void validateNotificationTemplates() {
        List<String> missing = java.util.Arrays.stream(
                        com.github.codehive.model.enums.NotificationType.values())
                .flatMap(type -> java.util.stream.Stream.of(
                        "templates/email/html/" + templateName(type) + ".html",
                        "templates/email/text/" + templateName(type) + ".txt"))
                .filter(path -> !new ClassPathResource(path).exists())
                .toList();
        if (!missing.isEmpty()) {
            throw new IllegalStateException("Missing notification email templates: " + missing);
        }
    }

    private String templateName(com.github.codehive.model.enums.NotificationType type) {
        return "notifications/" + type.name().toLowerCase(Locale.ROOT).replace('_', '-');
    }

    private ToneStyle tone(com.github.codehive.model.enums.NotificationType type) {
        return switch (type) {
            case STUDENT_ENROLLED, ASSIGNMENT_READY, ASSIGNMENT_PUBLISHED, GRADE_RETURNED ->
                    new ToneStyle("#DCFCE7", "#166534", "#86EFAC");
            case ASSIGNMENT_VALIDATION_FAILED, STUDENT_ENROLLMENT_CANCELLED, REMOVED_FROM_GROUP ->
                    new ToneStyle("#FEE2E2", "#991B1B", "#FCA5A5");
            case STUDENT_LEFT, LATE_ASSIGNMENT_SUBMITTED, ASSIGNMENT_DUE_SOON,
                 ASSIGNMENT_CLOSE_SOON, ASSIGNMENT_DUE_SOON_NO_SUBMISSION,
                 ASSIGNMENT_CLOSE_SOON_NO_SUBMISSION, ASSIGNMENT_RESCHEDULED,
                 ASSIGNMENT_UPDATED, ASSIGNMENT_TESTS_UPDATED, ASSIGNMENT_GRADES_CLEARED,
                 GROUP_ARCHIVED -> new ToneStyle("#FEF3C7", "#92400E", "#FCD34D");
            default -> new ToneStyle("#DBEAFE", "#1E40AF", "#93C5FD");
        };
    }

    private record ToneStyle(String background, String foreground, String border) {}

    public record RenderedEmail(String html, String text) {}
}
