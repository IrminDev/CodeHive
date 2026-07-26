package com.github.codehive.notification;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Component
public class EmailTemplateRenderer {
    private final TemplateEngine templateEngine;
    private final String frontendUrl;

    public EmailTemplateRenderer(TemplateEngine templateEngine,
                                 @Value("${frontend.url}") String frontendUrl) {
        this.templateEngine = templateEngine;
        this.frontendUrl = frontendUrl;
    }

    public RenderedEmail render(String templateName, Map<String, Object> variables) {
        Map<String, Object> model = new HashMap<>(variables);
        model.putIfAbsent("frontendUrl", frontendUrl);
        model.putIfAbsent("preferencesUrl", frontendUrl + "/settings/notifications");
        Context context = new Context(java.util.Locale.US);
        context.setVariables(model);
        return new RenderedEmail(
                templateEngine.process("email/html/" + templateName, context),
                templateEngine.process("email/text/" + templateName, context));
    }

    public RenderedEmail renderNotification(NotificationEmailContent content) {
        return render("notification", Map.of(
                "badge", content.badge(),
                "title", content.title(),
                "message", content.message(),
                "detailTitle", content.detailTitle(),
                "detailLines", content.detailLines(),
                "ctaLabel", content.ctaLabel(),
                "ctaUrl", content.ctaUrl()));
    }

    public record RenderedEmail(String html, String text) {}
}
