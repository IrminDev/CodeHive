plugins {
	java
	id("org.springframework.boot") version "3.5.6"
	id("io.spring.dependency-management") version "1.1.7"
	jacoco
}

group = "com.github"
version = "0.0.1-SNAPSHOT"
description = "CodeHive is a platform for educational puposes. It allows the teachers to create a group with their students, and the students can deliver code editting it from the same platform."

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter-data-jpa")
	implementation("org.springframework.boot:spring-boot-starter-security")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("org.springframework.boot:spring-boot-starter-validation")
	developmentOnly("org.springframework.boot:spring-boot-devtools")
	developmentOnly("org.springframework.boot:spring-boot-docker-compose")

	runtimeOnly("io.jsonwebtoken:jjwt-impl:0.13.0")
	implementation("io.jsonwebtoken:jjwt-api:0.13.0")
	runtimeOnly("io.jsonwebtoken:jjwt-jackson:0.13.0")

	implementation("org.springframework.boot:spring-boot-starter-mail")

	implementation("org.springdoc:springdoc-openapi-starter-webmvc-ui:2.8.13")

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
}

tasks.jacocoTestReport {
	dependsOn(tasks.test) // Tests are required to run before generating the report
	reports {
		xml.required.set(true)
		html.required.set(true)
		csv.required.set(false)
	}
}

tasks.jacocoTestCoverageVerification {
	violationRules {
		rule {
			limit {
				minimum = "0.70".toBigDecimal() // 70% minimum coverage
			}
		}
	}
}

// Optional: Make build task depend on coverage verification
tasks.check {
	dependsOn(tasks.jacocoTestCoverageVerification)
}
