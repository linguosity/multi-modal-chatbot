#!/usr/bin/env bash
set -euo pipefail

# Usage:
# REPORT_ID=... SECTION_IDS='["uuid1","uuid2"]' ./scripts/test-intake.sh

BASE_URL=${BASE_URL:-http://localhost:3000}
REPORT_ID=${REPORT_ID:?Set REPORT_ID}
SECTION_IDS=${SECTION_IDS:?Set SECTION_IDS as JSON array of UUIDs}
REPLACE=${REPLACE:-false}

curl -sS -X POST "$BASE_URL/api/ai/process-intake" \
  -F reportId="$REPORT_ID" \
  -F sectionIds="$SECTION_IDS" \
  -F replace="$REPLACE" \
  -F text=@fixtures/notes.txt;type=text/plain \
  -F file_0=@fixtures/sample.pdf;type=application/pdf

