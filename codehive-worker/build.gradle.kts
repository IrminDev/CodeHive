plugins {
    java
    id("org.springframework.boot") version "4.0.1"
    id("io.spring.dependency-management") version "1.1.7"
}

group = "com.github.codehive"
version = "0.0.1-SNAPSHOT"
description = "Worker service for sandboxed code execution"

java {
    toolchain {
        languageVersion = JavaLanguageVersion.of(21)
    }
}

repositories {
    mavenCentral()
}

dependencies {
    implementation("org.springframework.boot:spring-boot-starter")
	implementation("com.github.docker-java:docker-java-core:3.7.0")
	implementation("com.github.docker-java:docker-java-transport-httpclient5:3.7.0")
    testImplementation("org.springframework.boot:spring-boot-starter-test")
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")

    	// Minio
	implementation("io.minio:minio:8.6.0")

	// RabbitMQ
	implementation("org.springframework.boot:spring-boot-starter-amqp")
    
	// Timeout utility
	implementation("io.github.resilience4j:resilience4j-timelimiter:2.3.0")
}

tasks.withType<Test> {
    useJUnitPlatform {
        val tags = System.getProperty("tags")
        if (tags != null) includeTags(tags)
    }
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
        showCauses = true
        showStackTraces = true
    }
}

tasks.register<Test>("securityTest") {
    description = "Run sandbox security integration tests (requires Docker)"
    group = "verification"
    useJUnitPlatform { includeTags("security") }
    testLogging {
        events("passed", "skipped", "failed")
        exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
        showCauses = true
        showStackTraces = true
    }
}
