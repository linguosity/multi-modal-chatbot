#!/usr/bin/env bash
set -euo pipefail

# Usage:
# REPORT_ID=... SECTION_IDS='["uuid1"]' ./scripts/test-multimodal.sh

BASE_URL=${BASE_URL:-http://localhost:3000}
REPORT_ID=${REPORT_ID:?Set REPORT_ID}
SECTION_IDS=${SECTION_IDS:?Set SECTION_IDS as JSON array of UUIDs}
REPLACE=${REPLACE:-false}
OPTIONS=${OPTIONS:-'{"confidenceThreshold":0.6}'}

curl -sS -X POST "$BASE_URL/api/ai/process-multimodal" \
  -F reportId="$REPORT_ID" \
  -F sectionIds="$SECTION_IDS" \
  -F replace="$REPLACE" \
  -F textContent='Testing multimodal with fixtures' \
  -F file_0=@fixtures/sample.pdf;type=application/pdf \
  -F file_1=@fixtures/notes.txt;type=text/plain \
  -F processingOptions="$OPTIONS"

