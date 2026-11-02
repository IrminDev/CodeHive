"""Publishes the messages waiting for or held by the workers as a Cloud Monitoring metric."""
import base64
import json
import os
import signal
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone

METADATA_URL = "http://metadata.google.internal/computeMetadata/v1"
MANAGEMENT_URL = "http://127.0.0.1:15672"
QUEUES = ["codehive_queue", "codehive_test_generation_queue"]
METRIC_TYPE = "custom.googleapis.com/codehive/worker_queue_messages"
INTERVAL_SECONDS = 30
TIMEOUT_SECONDS = 10


def queue_messages(queue, username, password):
    credentials = base64.b64encode(f"{username}:{password}".encode()).decode()
    request = urllib.request.Request(
        f"{MANAGEMENT_URL}/api/queues/%2F/{queue}",
        headers={"Authorization": f"Basic {credentials}"},
    )
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
            return int(json.load(response).get("messages", 0))
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return 0
        raise


def time_series(project, value, now):
    return {
        "timeSeries": [{
            "metric": {"type": METRIC_TYPE},
            "resource": {"type": "global", "labels": {"project_id": project}},
            "metricKind": "GAUGE",
            "valueType": "INT64",
            "points": [{
                "interval": {"endTime": now.strftime("%Y-%m-%dT%H:%M:%SZ")},
                "value": {"int64Value": str(value)},
            }],
        }]
    }


def metadata(path):
    request = urllib.request.Request(f"{METADATA_URL}/{path}", headers={"Metadata-Flavor": "Google"})
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS) as response:
        return response.read().decode()


def publish(project, value):
    token = json.loads(metadata("instance/service-accounts/default/token"))["access_token"]
    request = urllib.request.Request(
        f"https://monitoring.googleapis.com/v3/projects/{project}/timeSeries",
        data=json.dumps(time_series(project, value, datetime.now(timezone.utc))).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=TIMEOUT_SECONDS):
        pass


def main():
    signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))
    username = os.environ["RABBITMQ_USERNAME"]
    password = os.environ["RABBITMQ_PASSWORD"]
    project = metadata("project/project-id")
    print(f"Publishing {METRIC_TYPE} every {INTERVAL_SECONDS}s for {QUEUES}")
    while True:
        try:
            publish(project, sum(queue_messages(queue, username, password) for queue in QUEUES))
        except Exception as error:  # pylint: disable=broad-except
            print(f"Could not publish the queue metric: {error}", file=sys.stderr)
        time.sleep(INTERVAL_SECONDS)


if __name__ == "__main__":
    main()
