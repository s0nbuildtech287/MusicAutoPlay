#!/bin/bash
set -e

echo "Installing yt-dlp..."

# Download yt-dlp binary
curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o yt-dlp

# Make it executable
chmod +x yt-dlp

# Verify installation
./yt-dlp --version

echo "yt-dlp installed successfully!"
