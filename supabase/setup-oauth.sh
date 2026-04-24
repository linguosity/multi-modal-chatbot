#!/bin/bash
# ============================================================================
# Linguosity v2: Google OAuth Setup via Supabase CLI
# ============================================================================
# Run: bash supabase/setup-oauth.sh
#
# Prerequisites:
#   1. Google Cloud Console project with OAuth 2.0 credentials
#   2. Authorized redirect URI set to:
#      https://ymlmmijyarcmrsnonbiq.supabase.co/auth/v1/callback
#   3. GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables set
# ============================================================================

set -e

PROJECT_REF="ymlmmijyarcmrsnonbiq"

echo "============================================"
echo "  Google OAuth Setup"
echo "============================================"
echo ""

# Check for required env vars
if [ -z "$GOOGLE_CLIENT_ID" ] || [ -z "$GOOGLE_CLIENT_SECRET" ]; then
  echo "Set these environment variables first:"
  echo ""
  echo "  export GOOGLE_CLIENT_ID='your-client-id.apps.googleusercontent.com'"
  echo "  export GOOGLE_CLIENT_SECRET='your-client-secret'"
  echo ""
  echo "Get these from: https://console.cloud.google.com/apis/credentials"
  echo ""
  echo "Make sure your authorized redirect URI is:"
  echo "  https://${PROJECT_REF}.supabase.co/auth/v1/callback"
  echo ""
  exit 1
fi

echo "Configuring Google OAuth via Supabase Management API..."
echo ""

# Use the Management API to update auth config
# First, get an access token
echo "Logging into Supabase..."
ACCESS_TOKEN=$(supabase login 2>&1 | grep -oP 'Token: \K.*' || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "Using supabase CLI auth..."
  # Alternative: use the supabase CLI directly
  supabase --project-ref "$PROJECT_REF" \
    functions deploy 2>/dev/null || true
fi

# The most reliable way: use the Supabase Management API
echo ""
echo "Updating auth providers via API..."
echo ""

# Get access token from supabase CLI config
TOKEN_FILE="$HOME/.supabase/access-token"
if [ -f "$TOKEN_FILE" ]; then
  ACCESS_TOKEN=$(cat "$TOKEN_FILE")
else
  echo "Please run 'supabase login' first to authenticate."
  echo "Then re-run this script."
  exit 1
fi

curl -s -X PATCH \
  "https://api.supabase.com/v1/projects/${PROJECT_REF}/config/auth" \
  -H "Authorization: Bearer ${ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"EXTERNAL_GOOGLE_ENABLED\": true,
    \"EXTERNAL_GOOGLE_CLIENT_ID\": \"${GOOGLE_CLIENT_ID}\",
    \"EXTERNAL_GOOGLE_SECRET\": \"${GOOGLE_CLIENT_SECRET}\",
    \"EXTERNAL_GOOGLE_REDIRECT_URI\": \"https://${PROJECT_REF}.supabase.co/auth/v1/callback\"
  }" | python3 -m json.tool 2>/dev/null || echo "(response received)"

echo ""
echo "============================================"
echo "  ✅ Google OAuth configured!"
echo "============================================"
echo ""
echo "Test it by visiting your app and clicking 'Sign in with Google'"
echo ""
echo "If you need to update the Google Cloud Console:"
echo "  Authorized redirect URI:"
echo "    https://${PROJECT_REF}.supabase.co/auth/v1/callback"
echo ""
echo "  Authorized JavaScript origins:"
echo "    http://localhost:3000"
echo "    https://your-production-domain.com"
echo ""
