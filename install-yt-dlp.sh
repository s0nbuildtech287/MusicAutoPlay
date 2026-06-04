#!/bin/bash
set -e

echo "========================================="
echo "Installing yt-dlp..."
echo "========================================="

# Download yt-dlp binary
echo "Downloading yt-dlp binary..."
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

# Make it executable
echo "Setting executable permissions..."
chmod +x yt-dlp

# Check if file exists
if [ -f "yt-dlp" ]; then
  echo "✓ yt-dlp file created successfully"
  ls -lh yt-dlp
else
  echo "✗ ERROR: yt-dlp file not found!"
  exit 1
fi

# Verify installation
echo "Verifying yt-dlp version..."
./yt-dlp --version

echo "========================================="
echo "✓ yt-dlp installed successfully!"
echo "========================================="
