#!/bin/bash

# Cleanup script for removing unnecessary files after refactoring

echo "Starting cleanup process..."

# Remove old reports structure
echo "Removing old reports structure..."
rm -rf src/app/reports

# Remove old dashboard/reports structure (now moved to dashboard/[userId]/reports)
echo "Removing old dashboard/reports structure..."
rm -rf src/app/dashboard/reports

# Check if files were removed successfully
if [ ! -d "src/app/reports" ] && [ ! -d "src/app/dashboard/reports" ]; then
  echo "Cleanup successful! Old files removed."
else
  echo "Warning: Some files may not have been removed. Please check manually."
fi

echo "Cleanup complete."