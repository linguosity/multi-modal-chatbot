#!/bin/bash

# Cleanup script for Linguosity project
# This script removes redundant files after refactoring

# Base directory
BASE_DIR="/Users/brandonbrewer/Documents/Linguosity/Linguosity"

# Step 1: Remove redundant page files
echo "Removing redundant page files..."
rm -f "$BASE_DIR/src/app/reports/page.tsx"
rm -f "$BASE_DIR/src/app/reports/layout.tsx"
rm -f "$BASE_DIR/src/app/reports/text-editor-test/page.tsx"

# Step 2: Remove backup and test files
echo "Removing backup and test files..."
rm -f "$BASE_DIR/src/app/reports/text-editor-test/page.tsx.bak"
rm -f "$BASE_DIR/src/app/reports/text-editor-test/simple-test.html"
rm -f "$BASE_DIR/src/app/reports/[id]/edit/page 2.tsx"

# Step 3: Remove demo and example files
echo "Removing demo and example files..."
rm -rf "$BASE_DIR/src/app/reports/claude-demo"
rm -rf "$BASE_DIR/src/app/reports/claude-simple"
rm -rf "$BASE_DIR/src/app/reports/function-demo"
rm -rf "$BASE_DIR/src/app/reports/example"
rm -rf "$BASE_DIR/src/app/reports/mcp-demo"

# Step 4: Remove old routes
echo "Removing old routes..."
rm -rf "$BASE_DIR/src/app/reports/[id]"
rm -rf "$BASE_DIR/src/app/reports/new"
rm -rf "$BASE_DIR/src/app/reports/speech-language"

echo "Cleanup complete!"