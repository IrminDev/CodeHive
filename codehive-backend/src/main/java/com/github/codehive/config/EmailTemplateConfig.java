package com.github.codehive.config;

import java.util.Set;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.templatemode.TemplateMode;
import org.thymeleaf.templateresolver.ClassLoaderTemplateResolver;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Configuration
public class EmailTemplateConfig {
    @Bean
    TemplateEngine emailTemplateEngine() {
        ClassLoaderTemplateResolver htmlResolver = new ClassLoaderTemplateResolver();
        htmlResolver.setPrefix("templates/");
        htmlResolver.setSuffix(".html");
        htmlResolver.setTemplateMode(TemplateMode.HTML);
        htmlResolver.setCharacterEncoding("UTF-8");
        htmlResolver.setCheckExistence(true);
        htmlResolver.setResolvablePatterns(Set.of("email/html/*"));

        ClassLoaderTemplateResolver textResolver = new ClassLoaderTemplateResolver();
        textResolver.setPrefix("templates/");
        textResolver.setSuffix(".txt");
        textResolver.setTemplateMode(TemplateMode.TEXT);
        textResolver.setCharacterEncoding("UTF-8");
        textResolver.setCheckExistence(true);
        textResolver.setResolvablePatterns(Set.of("email/text/*"));

        SpringTemplateEngine engine = new SpringTemplateEngine();
        engine.addTemplateResolver(htmlResolver);
        engine.addTemplateResolver(textResolver);
        return engine;
    }
}
