FROM python:3.13-alpine
COPY queue_metrics.py /app/queue_metrics.py
USER 65534
ENTRYPOINT ["python", "-u", "/app/queue_metrics.py"]
