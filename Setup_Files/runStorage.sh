PROJECT_DIR="$HOME/multichat-lobby"

cd "$PROJECT_DIR/Server/serverParts"
pm2 start storageServer.js --name storage-server
pm2 save