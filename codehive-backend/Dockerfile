FROM eclipse-temurin:21-jdk AS build
WORKDIR /workspace
COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle gradle
COPY src src
RUN sh ./gradlew --no-daemon bootJar

FROM eclipse-temurin:21-jre
RUN useradd --uid 10001 --create-home codehive
WORKDIR /app
COPY --from=build /workspace/build/libs/*-SNAPSHOT.jar app.jar
# Entities store LocalDateTime and the browser reads those values as local time.
ENV TZ=America/Mexico_City
USER 10001
EXPOSE 8080
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
