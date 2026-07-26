#!/bin/bash

set -e

# Configuration 
export DATABASE_IP=100.100.100.100
export DATABASE_PORT=3000

REPO_URL="https://github.com/frankZZzzzzzzzz/MultichatLobby"
PROJECT_DIR="$HOME/multichat-lobby"

# Update system
echo "Updating system packages..."
sudo apt update

# Install Git
echo "Installing Git..."
sudo apt install -y git

# Install Node.js and npm
echo "Installing Node.js and npm..."
sudo apt install -y nodejs npm

# Install PM2 globally
echo "Installing PM2 Globally"
sudo npm install -g pm2

# Clone/Update repository
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

# Install Server dependencies
echo "Installing server dependencies..."
cd "$PROJECT_DIR/Server"
npm ci

echo "Server Setup complete"

# Run Server
cd "$PROJECT_DIR/Server/serverParts"
pm2 start APIServer.js --name API-Server
pm2 save