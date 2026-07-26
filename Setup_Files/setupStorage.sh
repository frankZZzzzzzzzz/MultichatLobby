#!/bin/bash

set -e

# =========================
# Configuration
# =========================

REPO_URL="https://github.com/frankZZzzzzzzzz/MultichatLobby"
PROJECT_DIR="$HOME/multichat-lobby"

# =========================
# Update system
# =========================

echo "Updating system packages..."
sudo apt update

# =========================
# Install Git
# =========================

echo "Installing Git..."
sudo apt install -y git

# =========================
# Install Node.js and npm
# =========================

echo "Installing Node.js and npm..."
sudo apt install -y nodejs npm

# =========================
# Install PM2 globally
# =========================

echo "Installing PM2 Globally"
sudo npm install -g pm2

# =========================
# Clone repository
# =========================

if [ -d "$PROJECT_DIR" ]; then
    echo "Project directory already exists."
    echo "Pulling latest changes..."

    cd "$PROJECT_DIR"
    git pull
else
    echo "Cloning repository..."

    git clone "$REPO_URL" "$PROJECT_DIR"
    cd "$PROJECT_DIR"
fi

# =========================
# Install Server dependencies
# =========================

echo "Installing server dependencies..."

cd "$PROJECT_DIR/Server"

npm ci

# =========================
# Finish
# =========================

echo ""
echo "======================================"
echo "Storage server setup complete!"
echo "======================================"
echo ""
echo "Project location:"
echo "$PROJECT_DIR"
echo ""
echo "Server location:"
echo "$PROJECT_DIR/Server"
echo ""
echo "To start the server:"
echo "cd $PROJECT_DIR/Server"
echo "node serverParts/YOUR_SERVER_FILE.js"