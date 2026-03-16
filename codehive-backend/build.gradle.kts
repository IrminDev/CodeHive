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
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	developmentOnly("org.springframework.boot:spring-boot-docker-compose")

	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
	implementation("io.jsonwebtoken:jjwt-api:0.13.0")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.springframework.boot:spring-boot-starter-mail")

	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:3.0.2")

	// CSV parsing
	implementation("org.apache.commons:commons-csv:1.12.0")

	// Rate limiting
	implementation("com.bucket4j:bucket4j_jdk17-core:8.15.0")
	implementation("org.springframework.boot:spring-boot-starter-cache")
	implementation("org.springframework.boot:spring-boot-starter-aop")

	runtimeOnly("org.postgresql:postgresql")
	
	// Testing dependencies
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("org.springframework.security:spring-security-test")
	testImplementation("org.mockito:mockito-core")
	testImplementation("org.mockito:mockito-junit-jupiter")
	testImplementation("org.assertj:assertj-core")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
	testRuntimeOnly("com.h2database:h2")
}

tasks.withType<Test> {
	useJUnitPlatform()
	finalizedBy(tasks.jacocoTestReport) // Generate coverage report after tests
	
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
