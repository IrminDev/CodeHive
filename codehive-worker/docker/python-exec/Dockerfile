FROM python:3.13-slim

RUN pip uninstall -y pip setuptools wheel 2>/dev/null || true \
    && find /usr/local/bin -name "pip*" -delete 2>/dev/null || true \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# Verify: no gcc, no pip
RUN ! command -v gcc 2>/dev/null && ! command -v pip 2>/dev/null && python --version

RUN mkdir -p /workspace
WORKDIR /workspace

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=""

USER nobody
