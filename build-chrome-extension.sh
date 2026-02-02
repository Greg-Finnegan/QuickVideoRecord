#!/bin/bash

# Build script for QuickVideoRecord Chrome Extension
# This script clones the repo, installs dependencies, builds the extension,
# and creates a .env file with Jira credentials placeholders if missing

set -e  # Exit on any error

# Configuration
REPO_URL="https://github.com/Greg-Finnegan/QuickVideoRecord.git"
REPO_DIR="QuickVideoRecord"
OUTPUT_DIR="dist_chrome"

echo "=================================================="
echo "QuickVideoRecord Chrome Extension Builder"
echo "=================================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo "✓ npm version: $(npm --version)"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Error: git is not installed"
    echo "Please install git from https://git-scm.com/"
    exit 1
fi

echo "✓ git version: $(git --version)"
echo ""

# Clone or pull the repository
if [ -d "$REPO_DIR" ]; then
    echo "📁 Repository already exists. Pulling latest changes..."
    cd "$REPO_DIR"
    git pull
    echo ""
else
    echo "📥 Cloning repository..."
    git clone "$REPO_URL"
    cd "$REPO_DIR"
    echo ""
fi

# Create .env file if it doesn't exist
echo "🔧 Checking/creating .env file..."
ENV_FILE=".env"

if [ ! -f "$ENV_FILE" ]; then
    echo "Creating new .env file with placeholder values..."
    cat > "$ENV_FILE" << 'EOL'
# create in https://developer.atlassian.com/console/myapps/
JIRA_CLIENT_ID=your_id_here
JIRA_CLIENT_SECRET=your_secret_here
EOL
    echo "→ .env file created. Please edit it and add your real Jira OAuth credentials."
    echo ""
else
    echo "→ .env file already exists — skipping creation."
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --legacy-peer-deps
echo ""

# Build the extension
echo "🔨 Building extension..."
npm run build
echo ""

# Check if build was successful
if [ -d "$OUTPUT_DIR" ]; then
    echo "=================================================="
    echo "✅ Build completed successfully!"
    echo "=================================================="
    echo ""
    echo "📂 Extension location:"
    echo "   $(pwd)/$OUTPUT_DIR"
    echo ""
    echo "📋 To load in Chrome:"
    echo "   1. Open Chrome and go to: chrome://extensions/"
    echo "   2. Enable 'Developer mode' (toggle in top right)"
    echo "   3. Click 'Load unpacked'"
    echo "   4. Select the folder: $(pwd)/$OUTPUT_DIR"
    echo ""
else
    echo "❌ Build failed - output directory not found"
    exit 1
fi