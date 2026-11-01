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
USER 10001
ENTRYPOINT ["java", "-XX:-UsePerfData", "-jar", "app.jar"]
