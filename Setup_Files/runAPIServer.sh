PROJECT_DIR="$HOME/multichat-lobby"

cd "$PROJECT_DIR/Server/serverParts"
pm2 start APIServer.js --name api-server
pm2 save