#!/bin/bash
set -euo pipefail

METADATA_URL=http://metadata.google.internal/computeMetadata/v1
WORK_DIR=/var/lib/codehive/work
WORKER_UID=10001

metadata() { curl -fsS -H 'Metadata-Flavor: Google' "$METADATA_URL/$1"; }
attribute() { metadata "instance/attributes/$1" 2>/dev/null || echo "${2:-}"; }
secret() { gcloud secrets versions access latest --secret="$1"; }

PROJECT="$(metadata project/project-id)"
ZONE="$(metadata instance/zone)"
ZONE="${ZONE##*/}"
REGISTRY="${ZONE%-*}-docker.pkg.dev/$PROJECT/codehive"
DEPLOY_BUCKET="$PROJECT-codehive-deploy"
RABBITMQ_HOST="$(attribute rabbitmq-host)"
CONCURRENCY="$(attribute worker-concurrency 2)"

if [[ -z "$RABBITMQ_HOST" ]]; then
  echo "ERROR: set the rabbitmq-host metadata key" >&2
  exit 1
fi

RABBITMQ_PASSWORD="$(secret codehive-rabbitmq-password)"
STORAGE_ACCESS_KEY="$(secret codehive-storage-access-key)"
STORAGE_SECRET_KEY="$(secret codehive-storage-secret-key)"

until docker info >/dev/null 2>&1; do sleep 1; done

docker ps -aq | xargs -r docker rm -f >/dev/null
rm -rf "$WORK_DIR"
mkdir -p "$WORK_DIR"
chown "$WORKER_UID:$WORKER_UID" "$WORK_DIR"
chmod 0700 "$WORK_DIR"

mkdir -p /opt/codehive
gcloud storage cp "gs://$DEPLOY_BUCKET/vm/sandbox-images.txt" "gs://$DEPLOY_BUCKET/vm/pull-sandbox-images.sh" /opt/codehive/ \
  || echo "WARNING: using the VM scripts of the base image" >&2
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin "https://${REGISTRY%%/*}" \
  || echo "WARNING: could not log in to the registry; using preloaded images" >&2
bash /opt/codehive/pull-sandbox-images.sh "$REGISTRY" /opt/codehive/sandbox-images.txt
docker pull --quiet "$REGISTRY/worker:latest" || echo "WARNING: using the preloaded worker image" >&2
docker logout "https://${REGISTRY%%/*}" >/dev/null 2>&1 || true

ENV_FILE="$(mktemp -p /run)"
trap 'rm -f "$ENV_FILE"' EXIT
chmod 0600 "$ENV_FILE"
cat > "$ENV_FILE" <<ENV
RABBITMQ_HOST=$RABBITMQ_HOST
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=codehive
RABBITMQ_PASSWORD=$RABBITMQ_PASSWORD
MINIO_URL=https://storage.googleapis.com
MINIO_REGION=auto
MINIO_ACCESS_KEY=$STORAGE_ACCESS_KEY
MINIO_SECRET_KEY=$STORAGE_SECRET_KEY
MINIO_BUCKET_NAME=$PROJECT-codehive-artifacts
WORKER_CONCURRENCY=$CONCURRENCY
WORKER_MAX_CONCURRENCY=$CONCURRENCY
JAVA_TOOL_OPTIONS=-Xmx1g -Djava.io.tmpdir=$WORK_DIR
ENV

run_worker() {
  docker run -d --name codehive-worker --restart=always \
    --network host \
    --user "$WORKER_UID:$WORKER_UID" \
    --group-add "$(stat -c %g /var/run/docker.sock)" \
    --cap-drop ALL --security-opt no-new-privileges \
    --read-only --tmpfs /tmp \
    -v /var/run/docker.sock:/var/run/docker.sock \
    -v "$WORK_DIR:$WORK_DIR" \
    --env-file "$ENV_FILE" \
    --log-driver "$1" \
    "$REGISTRY/worker:latest"
}

if ! run_worker gcplogs; then
  echo "WARNING: log driver gcplogs failed; falling back to json-file" >&2
  docker rm -f codehive-worker >/dev/null 2>&1 || true
  run_worker json-file
fi

echo CODEHIVE_WORKER_STARTED
