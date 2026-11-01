#!/bin/bash
set -euo pipefail

METADATA_URL=http://metadata.google.internal/computeMetadata/v1

metadata() { curl -fsS -H 'Metadata-Flavor: Google' "$METADATA_URL/$1"; }

PROJECT="$(metadata project/project-id)"
ZONE="$(metadata instance/zone)"
ZONE="${ZONE##*/}"
REGISTRY="${ZONE%-*}-docker.pkg.dev/$PROJECT/codehive"
DEPLOY_BUCKET="$PROJECT-codehive-deploy"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/debian/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
. /etc/os-release
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/debian $VERSION_CODENAME stable" \
  > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

mkdir -p /etc/docker
cat > /etc/docker/daemon.json <<'JSON'
{
  "mtu": 1460,
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON
systemctl enable docker
systemctl restart docker

mkdir -p /opt/codehive
gcloud storage cp "gs://$DEPLOY_BUCKET/vm/sandbox-images.txt" "gs://$DEPLOY_BUCKET/vm/pull-sandbox-images.sh" /opt/codehive/
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin "https://${REGISTRY%%/*}"
bash /opt/codehive/pull-sandbox-images.sh "$REGISTRY" /opt/codehive/sandbox-images.txt
for image in worker:latest queue-metrics:latest rabbitmq:4.2.2-management-alpine; do
  docker pull --quiet "$REGISTRY/$image"
done
docker logout "https://${REGISTRY%%/*}"
apt-get clean

echo CODEHIVE_BASE_IMAGE_READY
