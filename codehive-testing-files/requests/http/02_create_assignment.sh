#!/usr/bin/env bash
# ============================================================
# STEP 2 — Create an assignment (teacher / admin only)
#
# Prerequisites:
#   1. Run 01_login.http first and set TOKEN below.
#   2. Run this script from the requests/ directory so that
#      relative paths to solutions/ and test_cases/ resolve.
#
# Usage:
#   cd codehive-testing-files/requests
#   TOKEN="<paste-jwt-here>" bash http/02_create_assignment.sh
#
# On success the server returns HTTP 202 with a JSON body that
# contains the assignment UUID — copy it into the @assignmentId
# variable at the top of the other .http files.
# ============================================================

BASE_URL="${BASE_URL:-http://localhost:8080}"
TOKEN="${TOKEN:?Please set TOKEN to a valid JWT}"

METADATA='{
  "title": "Maximum Sum of Sliding Window",
  "description": "Given N integers and window size K, find the maximum sum of any contiguous subarray of length K.",
  "timeLimitMs": 1000,
  "memoryLimitMb": 256,
  "comparatorType": "EXACT_MATCH",
  "allowedLanguages": ["JAVA", "PYTHON", "C", "CPP"],
  "referenceLanguage": "C",
  "dueDate": "2025-12-31T23:59:59",
  "constraints": ["1 <= N <= 200000", "1 <= K <= N", "-10^4 <= nums[i] <= 10^4"],
  "hints": ["Consider using a sliding window technique"],
  "tags": ["sliding window", "arrays"],
  "sampleFlags": [true, false, false, false, false]
}'

# sampleFlags: input1 is a sample (visible to students); inputs 2-5 are hidden

curl -s -X POST "${BASE_URL}/api/assignments" \
  -H "Authorization: Bearer ${TOKEN}" \
  -F "metadata=${METADATA};type=application/json" \
  -F "referenceSolution=@solutions/reference_solution.c;type=text/plain" \
  -F "testCaseInputs=@test_cases/input1.txt;type=text/plain" \
  -F "testCaseInputs=@test_cases/input2.txt;type=text/plain" \
  -F "testCaseInputs=@test_cases/input3.txt;type=text/plain" \
  -F "testCaseInputs=@test_cases/input4.txt;type=text/plain" \
  -F "testCaseInputs=@test_cases/input5.txt;type=text/plain" \
  | python3 -m json.tool

echo ""
echo "Copy the 'id' field from the response above and set it as assignmentId in the .http files."
