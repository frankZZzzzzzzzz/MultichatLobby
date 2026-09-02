## Multichat Lobby

A simple web-based chat application where users can create and join different chat lobbies using a lobby ID.

# Features
* Create new chat lobbies
* Join existing lobbies using a lobby ID
* Send messages in a lobby
* Automatically refresh messages
* Simple frontend and backend structure

# Project Structure
MultichatLobby/
├── Server/
│   ├── serverParts/
│   ├── APILoadStress.js
│   ├── package.json
│   └── package-lock.json
│
└── Website/
    ├── index.html
    ├── app.js
    └── style.css

# Requirements
Node.js
A modern web browser

# Installation
Clone the repository:
```sh
git clone https://github.com/frankZZzzzzzzzz/MultichatLobby.git
cd MultichatLobby
```

Install the server dependencies:
```sh
cd Server
npm install
```

# Running the Servers
1. Start the Storage Server
Start the storage server first. The API server depends on it.
```sh
node serverParts/storageServer.js
```

1. Start the API Server
In a new terminal, start the API server:
```sh
node serverParts/apiServer.js
```

1. Connect to the API Server
Open a browser and http into the API server using either:

http://localhost:<API_PORT>

or, if the server is accessible over the network:

http://<PUBLIC_IP>:<API_PORT>

Replace <API_PORT> with the port configured by the API server (default=3000).

If you're hosting the API publicly, make sure the API server's port is accessible through your firewall/network configuration.

The frontend communicates with the backend through endpoints such as:

GET /newLobby — creates a new lobby
GET /getMessages?id=<id> — retrieves messages for a lobby
POST /uploadMessage — sends a message to a lobby

# Technologies
HTML
CSS
JavaScript
Node.js
Express