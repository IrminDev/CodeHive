FROM debian:12-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        libc6 \
        libgcc-s1 \
        coreutils \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Verify no compiler snuck in
RUN ! command -v gcc 2>/dev/null && ! command -v cc 2>/dev/null

RUN mkdir -p /workspace
WORKDIR /workspace

USER nobody
