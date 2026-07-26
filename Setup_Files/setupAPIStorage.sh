#!/bin/bash

set -e

# =========================
# Configuration
# =========================

REPO_URL="https://github.com/frankZZzzzzzzzz/MultichatLobby"
PROJECT_DIR="$HOME/multichat-lobby"

# API server entry point
API_SERVER="serverParts/APIServer.js"

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
# Install PM2
# =========================

echo "Installing PM2..."
sudo npm install -g pm2

# =========================
# Clone or update repository
# =========================

if [ -d "$PROJECT_DIR/.git" ]; then
    echo "Repository already exists."
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

echo "Installing API server dependencies..."

cd "$PROJECT_DIR/Server"

npm ci

# =========================
# Start API Server with PM2
# =========================

echo "Starting API server with PM2..."

pm2 start "$API_SERVER" --name api-server

# Save PM2 process list
pm2 save

# =========================
# Configure PM2 startup
# =========================

echo "Configuring PM2 to start on system boot..."

pm2 startup

echo ""
echo "======================================"
echo "API server setup complete!"
echo "======================================"
echo ""
echo "Project location:"
echo "$PROJECT_DIR"
echo ""
echo "API server:"
echo "$PROJECT_DIR/Server/$API_SERVER"
echo ""
echo "PM2 process:"
pm2 status