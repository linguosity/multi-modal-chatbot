#!/usr/bin/env bash
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:3000}
SECTION=${SECTION:-header}

payload=$(cat <<JSON
{
  "sectionKey": "$SECTION",
  "fields": ["first_name", "grade", "primary_languages"],
  "sources": [
    {"type":"text","artifactId":"note-1","text":"Student: Ana Diaz. Grade: 3rd. Primary languages: English."}
  ]
}
JSON
)

curl -sS -X POST "$BASE_URL/api/analyze" -H 'Content-Type: application/json' -d "$payload"
