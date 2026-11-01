#!/bin/bash
set -uo pipefail

registry="$1"
images_file="$2"
failed=0

while read -r image; do
  if docker pull --quiet "$registry/sandbox/$image"; then
    docker tag "$registry/sandbox/$image" "$image"
  elif docker image inspect "$image" >/dev/null 2>&1; then
    echo "WARNING: could not refresh $image; using the preloaded copy" >&2
  else
    echo "ERROR: $image is not available" >&2
    failed=1
  fi
done < "$images_file"

exit "$failed"
