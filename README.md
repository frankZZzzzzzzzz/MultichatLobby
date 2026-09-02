# Multichat Lobby

A simple web-based chat application where users can create and join different chat lobbies using a lobby ID.

## Features
* Create new chat lobbies
* Join existing lobbies using a lobby ID
* Send messages in a lobby
* Automatically refresh messages
* Simple frontend and backend structure

## Project Structure
```text
MultichatLobby/<br>
├── Server/<br>
│   ├── serverParts/<br>
│   ├── APILoadStress.js<br>
│   ├── package.json<br>
│   └── package-lock.json<br>
│
└── Website/<br>
    ├── index.html<br>
    ├── app.js<br>
    └── style.css<br>
```

## Requirements
Node.js
A modern web browser

## Installation
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

## Running the Servers
1. Start the Storage Server
Start the storage server first. The API server depends on it.
```sh
node serverParts/storageServer.js
```

2. Start the API Server
In a new terminal, start the API server:
```sh
node serverParts/apiServer.js
```

3. Connect to the API Server
Open a browser and http into the API server using either:

http://localhost:<API_PORT>

or, if the server is accessible over the network:

http://<PUBLIC_IP>:<API_PORT>

Replace <API_PORT> with the port configured by the API server (default=3000).

If you're hosting the API publicly, make sure the API server's port is accessible through your firewall/network configuration.

The frontend communicates with the backend through endpoints such as:

GET /newLobby — creates a new lobby<br>
GET /getMessages?id=<id> — retrieves messages for a lobby<br>
POST /uploadMessage — sends a message to a lobby<br>

## Technologies
HTML<br>
CSS<br>
JavaScript<br>
Node.js<br>
Express<br>