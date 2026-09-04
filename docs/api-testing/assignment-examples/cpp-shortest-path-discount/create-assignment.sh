#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOKEN="${TOKEN:?Set TOKEN to a teacher JWT}"
GROUP_ID="${GROUP_ID:?Set GROUP_ID to an owned active group UUID}"

script_dir="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$script_dir"

metadata="$(sed "s/00000000-0000-0000-0000-000000000001/${GROUP_ID}/" metadata.json)"

curl --fail-with-body --silent --show-error --request POST "${BASE_URL}/api/assignments" \
  --header "Authorization: Bearer ${TOKEN}" \
  --form "metadata=${metadata};type=application/json" \
  --form "referenceSolution=@reference.cpp;type=text/plain" \
  --form "testCaseInputs=@inputs/01-sample.in;type=text/plain" \
  --form "testCaseInputs=@inputs/02.in;type=text/plain" \
  --form "testCaseInputs=@inputs/03.in;type=text/plain" \
  --form "testCaseInputs=@inputs/04.in;type=text/plain"
