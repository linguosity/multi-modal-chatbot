#!/bin/bash
# ============================================================================
# Linguosity v2: New Supabase Project Setup
# ============================================================================
# Run this from the project root: bash supabase/setup.sh
# Requires: supabase CLI installed (brew install supabase/tap/supabase)
# ============================================================================

set -e

PROJECT_REF="ymlmmijyarcmrsnonbiq"
DB_PASSWORD=""  # You'll be prompted

echo "============================================"
echo "  Linguosity v2 — Supabase Setup"
echo "============================================"
echo ""

# Check for supabase CLI
if ! command -v supabase &> /dev/null; then
  echo "❌ Supabase CLI not found. Install it:"
  echo "   brew install supabase/tap/supabase"
  echo "   OR: npx supabase@latest"
  exit 1
fi

echo "Step 1: Link to Supabase project..."
echo "You'll need your database password from the Supabase dashboard."
echo ""
supabase link --project-ref "$PROJECT_REF"

echo ""
echo "Step 2: Run migration..."
echo ""
supabase db push

echo ""
echo "Step 3: Verify tables..."
echo ""
supabase db dump --schema public | grep "CREATE TABLE" | head -20

echo ""
echo "============================================"
echo "  ✅ Schema deployed successfully!"
echo "============================================"
echo ""
echo "Tables created:"
echo "  • reports (no sections JSONB!)"
echo "  • report_sections (sole source of truth)"
echo "  • report_section_types (seeded with 13 types)"
echo "  • report_templates"
echo "  • file_uploads (NEW)"
echo "  • user_settings"
echo "  • user_school_sites"
echo "  • progress_events"
echo "  • storage bucket: assessment-files (NEW)"
echo ""
echo "Next steps:"
echo "  1. Set up Google OAuth (see supabase/setup-oauth.sh)"
echo "  2. Update .env.local (already done if you ran this script)"
echo "  3. Start the dev server: pnpm dev"
echo ""
