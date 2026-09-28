plugins {
	java
	id("org.springframework.boot") version "3.5.11"
	id("io.spring.dependency-management") version "1.1.7"
	jacoco
}

group = "com.github"
version = "0.0.1-SNAPSHOT"
description = "CodeHive is a platform for educational puposes. It allows the teachers to create a group with their students, and the students can deliver code editting it from the same platform."

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-websocket")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	implementation("org.springframework.ai:spring-ai-starter-model-google-genai:1.1.8")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	developmentOnly("org.springframework.boot:spring-boot-docker-compose")

	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
	implementation("io.jsonwebtoken:jjwt-api:0.13.0")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.springframework.boot:spring-boot-starter-mail")
	implementation("org.springframework.boot:spring-boot-starter-thymeleaf")

	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.13")

	// CSV parsing
	implementation("org.apache.commons:commons-csv:1.12.0")

	// Rate limiting
	implementation("com.bucket4j:bucket4j_jdk17-core:8.15.0")
	implementation("org.springframework.boot:spring-boot-starter-cache")
	implementation("org.springframework.boot:spring-boot-starter-aop")
	implementation("org.flywaydb:flyway-core")
	runtimeOnly("org.flywaydb:flyway-database-postgresql")

	runtimeOnly("org.postgresql:postgresql")
	
	// Testing dependencies
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("org.mockito:mockito-core")
	testImplementation("org.mockito:mockito-junit-jupiter")
	testImplementation("org.assertj:assertj-core")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	testRuntimeOnly("com.h2database:h2")

	// Minio
	implementation("io.minio:minio:8.6.0")

	// RabbitMQ
	implementation("org.springframework.boot:spring-boot-starter-amqp")
}

tasks.withType<Test> {
	useJUnitPlatform()
	
	// Show test results in console
	testLogging {
		events("passed", "skipped", "failed", "standardOut", "standardError")
		exceptionFormat = org.gradle.api.tasks.testing.logging.TestExceptionFormat.FULL
		showExceptions = true
		showCauses = true
		showStackTraces = true
		
		// Show test name and result
		showStandardStreams = false
	}
	
	// Summary after all tests
	afterSuite(KotlinClosure2<TestDescriptor, TestResult, Unit>({ desc, result ->
		if (desc.parent == null) { // Only print summary for root suite
			println("\n--- Test Results ---")
			println("Tests run: ${result.testCount}")
			println("Passed: ${result.successfulTestCount}")
			println("Failed: ${result.failedTestCount}")
			println("Skipped: ${result.skippedTestCount}")
			println("--------------------")
		}
	}))
}

val postgresAssistantTest by tasks.registering(Test::class) {
	description = "Runs assistant integration checks against an isolated PostgreSQL database"
	group = "verification"
	testClassesDirs = sourceSets.test.get().output.classesDirs
	classpath = sourceSets.test.get().runtimeClasspath
	filter {
		includeTestsMatching("*AssistantTransactionServiceIntegrationTest")
		includeTestsMatching("*AssistantControllerIntegrationTest")
		includeTestsMatching("*AssistantPostgresSchemaIntegrationTest")
	}
	val databaseUrl = providers.environmentVariable("CODEHIVE_ASSISTANT_TEST_DATABASE_URL")
	val databasePassword = providers.environmentVariable("CODEHIVE_ASSISTANT_TEST_DATABASE_PASSWORD")
	doFirst {
		require(databaseUrl.isPresent && databasePassword.isPresent) {
			"Set CODEHIVE_ASSISTANT_TEST_DATABASE_URL and CODEHIVE_ASSISTANT_TEST_DATABASE_PASSWORD for a disposable PostgreSQL database"
		}
	}
	systemProperty("spring.datasource.url", databaseUrl.orNull ?: "")
	systemProperty("spring.datasource.username", providers.environmentVariable("CODEHIVE_ASSISTANT_TEST_DATABASE_USERNAME").orNull ?: "postgres")
	systemProperty("spring.datasource.password", databasePassword.orNull ?: "")
	systemProperty("spring.datasource.driver-class-name", "org.postgresql.Driver")
	systemProperty("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect")
	systemProperty("spring.jpa.hibernate.ddl-auto", "create-drop")
	systemProperty("spring.flyway.enabled", "false")
	systemProperty("spring.ai.model.chat", "none")
}

tasks.test {
	finalizedBy(tasks.jacocoTestReport) // Generate coverage report after standard tests only
	useJUnitPlatform {
		excludeTags("postgres-assistant", "live-assistant")
	}
}

val liveAssistantTest by tasks.registering(Test::class) {
	description = "Runs synthetic assistant safety fixtures against explicitly configured Gemini"
	group = "verification"
	testClassesDirs = sourceSets.test.get().output.classesDirs
	classpath = sourceSets.test.get().runtimeClasspath
	filter.includeTestsMatching("*LiveAssistantQualificationTest")
	systemProperty("spring.ai.model.chat", "google-genai")
	systemProperty("assistant.model-timeout-seconds",
		providers.environmentVariable("ASSISTANT_MODEL_TIMEOUT_SECONDS").orNull ?: "20")
	providers.environmentVariable("CODEHIVE_ASSISTANT_LIVE_MODEL").orNull?.let {
		systemProperty("spring.ai.google.genai.chat.options.model", it)
	}
}

tasks.jacocoTestReport {
	dependsOn(tasks.test) // Tests are required to run before generating the report
	reports {
		xml.required.set(true)
		html.required.set(true)
		csv.required.set(false)
	}
}

tasks.check {
	dependsOn(tasks.jacocoTestCoverageVerification)
}
