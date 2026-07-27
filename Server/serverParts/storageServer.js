require("dotenv").config();
const net = require("net");

const MAX_MESSAGES = Number(process.env.MAX_STORED_MESSAGES) || 500;
const DATABASE_PORT = Number(process.env.DATABASE_PORT) || 3000;

let offset = 0;
const lobbies = new Map();
const clients = new Set();

const server = net.createServer()

function log(message){
    console.log(`${(new Date).toISOString()}: ${message}`);
}
function broadcast(objData, exceptionSocket=null){
    //log(`Broadcasting to ${clients.size} clients: objData`);
    clients.forEach((clientSocket)=>{
        if (clientSocket !== exceptionSocket)
            clientSocket.write(JSON.stringify(objData) + "\n");
    });
}
function handleAction(socket, data){
    //log("Storage TCP receive");
    switch(data.action){
        case "upload": 
            if (!lobbies.has(Number(data.id))){
                console.log(`${(new Date).toISOString}: Attempted to upload to non-existent Lobby (#${data.id}). Message: ${data.message}`);
                socket.write(JSON.stringify({
                    ...data,
                    message: "Lobby does not exist"
                }) + "\n")
                return;
            }
            const lobbyMessages = lobbies.get(Number(data.id));
            lobbyMessages.push(data.message);

            if (lobbyMessages.length > MAX_MESSAGES)
                lobbyMessages.shift();

            socket.write(JSON.stringify({
                ...data,
                action: "updatedMessages",
                messages: lobbyMessages
            }) + "\n")

            broadcast({
                id: Number(data.id),
                action: "updatedMessages",
                messages: lobbyMessages
            }, socket);

            //log("Storage TCP send upload");
            break;
        case "newLobby":
            lobbies.set(offset, [`Lobby #: ${offset} first message!`]);
            
            socket.write(JSON.stringify({
                ...data,
                id: offset, 
                action: "newLobby", 
                messages: lobbies.get(offset)
            }) + "\n")

            broadcast({
                id: offset, 
                action: "newLobby", 
                messages: lobbies.get(offset)
            }, socket);
            //log("Storage TCP send new lobby");
            offset++;
            break;
        case "load Cache":
            const returnData = {
                ...data,
                lobbies: Object.fromEntries(lobbies)
            }
            socket.write(JSON.stringify(returnData) + "\n")
            //log("Storage TCP sent cache");
            break;
    }

}
server.on("connection", (socket)=>{
    //Add client to list if connected and send all data for caching
    clients.add(socket);
    log(`Socket Connected: ${socket.remoteAddress}:${socket.remotePort}`);

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
server.listen(DATABASE_PORT, ()=>{
    console.log("Currently Listening to Port: " + DATABASE_PORT);
});