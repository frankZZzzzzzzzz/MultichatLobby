require("dotenv").config();
const net = require("net");

const MAX_MESSAGES = Number(process.env.MAX_STORED_MESSAGES) || 1000;
const DATABASEPORT = Number(process.env.DATABASE_PORT) || 3000;

let offset = 0;
const lobbies = new Map();
const clients = new Set();

const server = net.createServer()

function log(message){
    console.log(`${(new Date).toISOString()}: ${message}`);
}
function broadcast(objData){
    clients.forEach((clientSocket)=>{
        clientSocket.write(JSON.stringify(objData) + "\n");
    })
}
function handleAction(socket, data){
    log("Storage TCP receive");
    switch(data.action){
        case "upload": 
            if (!lobbies.has(data.id)){
                console.log(`${(new Date).toISOString}: Attempted to upload to non-existent Lobby (#${data.id}). Message: ${data.message}`);
                return;
            }
            const lobbyMessages = lobbies.get(data.id);
            lobbyMessages.push(data.message);
            if (lobbyMessages.length > MAX_MESSAGES)
                lobbyMessages.shift();

            const newData = {
                ...data,
                action: "updatedMessages",
                messages: lobbyMessages
            }
            socket.write(JSON.stringify(newData) + "\n")
            broadcast(newData);
            log("Storage TCP send upload");
            break;
        case "newLobby":
            const newLobbyData = {
                ...data,
                id: offset, 
                action: "newLobby", 
                messages: [`Lobby #: ${offset} first message!`]
            }
            lobbies.set(offset, newLobbyData.messages);
            
            socket.write(JSON.stringify(newLobbyData) + "\n")
            broadcast(newLobbyData);
            offset++;
            log("Storage TCP send new lobby");
            break;
        case "load Cache":
            const returnData = {
                ...data,
                lobbies: Object.fromEntries(lobbies)
            }
            socket.write(JSON.stringify(returnData) + "\n")
            log("Storage TCP send cache");
            break;
    }

}
server.on("connection", (socket)=>{
    //Add client to list if connected and send all data for caching
    clients.add(socket);
    //const obj = {action: "Load Cache", lobbies: Object.fromEntries(lobbies)};
    //socket.write(JSON.stringify(obj) + "\n");

    //Remove client from list if connection has been closed or error
    socket.on("close", ()=>clients.delete(socket));
    socket.on("error", ()=>clients.delete(socket));


    let dataInBuffer = "";
    socket.on("data", (chunk)=>{
        dataInBuffer += chunk;

        const messages = dataInBuffer.split("\n");
        dataInBuffer = messages.pop();

        messages.forEach((message)=>{
            const data = JSON.parse(message);
            handleAction(socket, data);
        });
    });
});
server.listen(DATABASEPORT);