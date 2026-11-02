#!/bin/bash
set -euo pipefail

: "${REGISTRY:?Set REGISTRY, e.g. us-central1-docker.pkg.dev/my-project/codehive}"
PLATFORM=linux/amd64
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGES_FILE="$ROOT/deploy/gcp/vm/sandbox-images.txt"

declared="$(grep -rhoE '(COMPILE|EXEC)_IMAGE = "[^"]+"' "$ROOT/codehive-worker/src/main/java" \
  | sed -E 's/.*"(.+)"/\1/' | sort -u)"
listed="$(sort -u "$IMAGES_FILE")"
if [[ "$declared" != "$listed" ]]; then
  echo "sandbox-images.txt does not match the images declared in the worker executors:" >&2
  diff <(echo "$declared") <(echo "$listed") >&2 || true
  exit 1
fi

build() {
  docker build --platform "$PLATFORM" -t "$REGISTRY/$1" "$ROOT/$2"
  docker push "$REGISTRY/$1"
}

mirror() {
  docker pull --platform "$PLATFORM" "$1"
  docker tag "$1" "$REGISTRY/$2"
  docker push "$REGISTRY/$2"
}

build backend:latest codehive-backend
build worker:latest codehive-worker
build queue-metrics:latest deploy/gcp/queue-metrics
mirror rabbitmq:4.2.2-management-alpine rabbitmq:4.2.2-management-alpine

while read -r image; do
  if [[ "$image" == irmindev/* ]]; then
    name="${image#irmindev/}"
    build "sandbox/$image" "codehive-worker/docker/${name%%:*}"
  else
    mirror "$image" "sandbox/$image"
  fi
done < "$IMAGES_FILE"
