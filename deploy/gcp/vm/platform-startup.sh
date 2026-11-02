#!/bin/bash
set -euo pipefail

METADATA_URL=http://metadata.google.internal/computeMetadata/v1
DISK=/dev/disk/by-id/google-rabbitmq-data
MOUNT=/mnt/disks/rabbitmq

metadata() { curl -fsS -H 'Metadata-Flavor: Google' "$METADATA_URL/$1"; }
secret() { gcloud secrets versions access latest --secret="$1"; }

PROJECT="$(metadata project/project-id)"
ZONE="$(metadata instance/zone)"
ZONE="${ZONE##*/}"
REGISTRY="${ZONE%-*}-docker.pkg.dev/$PROJECT/codehive"
RABBITMQ_IMAGE="$REGISTRY/rabbitmq:4.2.2-management-alpine"
METRICS_IMAGE="$REGISTRY/queue-metrics:latest"
RABBITMQ_PASSWORD="$(secret codehive-rabbitmq-password)"

if [[ ! -e "$DISK" ]]; then
  echo "ERROR: attach the persistent disk with device name rabbitmq-data" >&2
  exit 1
fi
blkid "$DISK" >/dev/null 2>&1 || mkfs.ext4 -m 0 -E lazy_itable_init=0,lazy_journal_init=0,discard "$DISK"
mkdir -p "$MOUNT"
mountpoint -q "$MOUNT" || mount -o discard,defaults "$DISK" "$MOUNT"
mkdir -p "$MOUNT/data"

until docker info >/dev/null 2>&1; do sleep 1; done

gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin "https://${REGISTRY%%/*}" \
  || echo "WARNING: could not log in to the registry; using preloaded images" >&2
docker pull --quiet "$RABBITMQ_IMAGE" || echo "WARNING: using the preloaded RabbitMQ image" >&2
docker pull --quiet "$METRICS_IMAGE" || echo "WARNING: using the preloaded queue-metrics image" >&2
docker logout "https://${REGISTRY%%/*}" >/dev/null 2>&1 || true

ENV_FILE="$(mktemp -p /run)"
trap 'rm -f "$ENV_FILE"' EXIT
chmod 0600 "$ENV_FILE"
cat > "$ENV_FILE" <<ENV
RABBITMQ_DEFAULT_USER=codehive
RABBITMQ_DEFAULT_PASS=$RABBITMQ_PASSWORD
RABBITMQ_USERNAME=codehive
RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD
ENV

run_container() {
  local name="$1"
  shift
  docker rm -f "$name" >/dev/null 2>&1 || true
  if ! docker run -d --name "$name" --restart=always --env-file "$ENV_FILE" --log-driver gcplogs "$@"; then
    echo "WARNING: log driver gcplogs failed; falling back to json-file" >&2
    docker rm -f "$name" >/dev/null 2>&1 || true
    docker run -d --name "$name" --restart=always --env-file "$ENV_FILE" --log-driver json-file "$@"
  fi
}

# RabbitMQ names its data directory after the hostname, so it must not change.
run_container codehive-rabbitmq --hostname codehive-rabbitmq \
  -p 5672:5672 -p 127.0.0.1:15672:15672 \
  -v "$MOUNT/data:/var/lib/rabbitmq" \
  "$RABBITMQ_IMAGE"
run_container codehive-queue-metrics --network host "$METRICS_IMAGE"

echo CODEHIVE_PLATFORM_STARTED
