FROM eclipse-temurin:21-jre-ubi9-minimal

# Remove tools that have no place in an execution sandbox (best-effort, ignore missing)
RUN microdnf remove -y curl wget tar gzip findutils procps-ng 2>/dev/null || true \
    && microdnf clean all \
    && rm -rf /var/cache/dnf /tmp/* /var/tmp/*

# Verify: javac must NOT be present (JRE image, not JDK)
RUN ! command -v javac 2>/dev/null

RUN mkdir -p /workspace
WORKDIR /workspace

USER nobody
