require("dotenv").config();

const net = require("net");

const express = require("express");
const path = require("path");
const os = require("os");

const DATABASE_PORT = Number(process.env.DATABASE_PORT) || 3000;
const DATABASE_IP = process.env.DATABASE_IP || "localhost"
const API_SERVER_PORT = Number(process.env.API_SERVER_PORT) || 3000;

//Local Cache
const lobbies = new Map();

//TCP connect to Server
const client = net.createConnection(DATABASE_PORT, DATABASE_IP);
const specificRequests = new Map();
let responseIDCounter = 0;

function log(message){
    console.log(`${(new Date).toISOString()}: ${message}`);
}
client.on("connect", async ()=>{
    lobbies.clear();
    console.log("Connected");

    //Get Cache 
    const cacheData = await sendAndWaitforResponse({action: "load Cache"});
    Object.entries(cacheData.lobbies).forEach(([id, messages])=>{
        lobbies.set(Number(id), messages);
    })
    console.log(lobbies)
});

let dataInBuffer = "";
client.on("data", (data)=>{
    log("TCP Receive: " + data.toString());
    
    dataInBuffer += data.toString();
    const allLobbiesInfo = dataInBuffer.split("\n");
    dataInBuffer = allLobbiesInfo.pop();
    
    allLobbiesInfo.forEach((lobby)=>{
        const lobbyInfo = JSON.parse(lobby);
        log(lobbyInfo.requestID || lobbyInfo.action);

        //Handle specific requests/responses
        if (specificRequests.has(lobbyInfo.requestId)){
            specificRequests.get(lobbyInfo.requestId).resolve(lobbyInfo);
            specificRequests.delete(lobbyInfo.requestId);
        } //Handle broad responses
        else{
            switch(lobbyInfo.action){
                case "updatedMessages":
                    const id = lobbyInfo.id;
                    const messages = lobbyInfo.messages;
                    lobbies.set(id, messages);
                    break;

            }
        }
    });
});
client.on("error", (err) => {
    console.log("Database TCP error:", err.message);
});
client.on("close", () => {
    console.log("Database TCP connection closed");

    // Delete all specific requests
    for (const [, request] of specificRequests) {
        request.reject(new Error("TCP connection closed"));
    }
    specificRequests.clear();
});
function writeToServer(data){
    log("TCP SEND: " + JSON.stringify(data));
    client.write(JSON.stringify(data) + "\n");
}
function sendAndWaitforResponse(data, maxWaitTime = 1000){
    const requestId = responseIDCounter++;

    return (new Promise((resolve, reject)=>{
        const timer = setTimeout(()=>{
            specificRequests.delete(requestId)
            reject(new Error("TCP response timeout"));
        }, maxWaitTime);
        specificRequests.set(requestId, {
            resolve: (data)=>{
                clearTimeout(timer);
                resolve(data);
            }
        });
        writeToServer({
            ...data,
            requestId: requestId
        })
    }));
}
//HTTP requests to client
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../../Website")));

app.get('/getMessages', (req, res) => {
    //log("GET MESSAGES");
    const id = Number(req.query.id);

    if (!lobbies.has(id)){
        res.send({
            id: id,
            status: null,
            messages: "IDK",
        });
        return;
    }
    //console.log(`${(new Date()).toISOString()}: Got messages from Lobby: ${id}`);
    res.send({
        id: id,
        status: "found",
        messages: lobbies.get(id),
    });
});
app.get('/newLobby', async (req, res) => {
    //log("NEW MESSAGE");
    let newLobbyData;
    try{
        newLobbyData = await sendAndWaitforResponse({action: "newLobby", status: null});
        newLobbyData.status = "created";
    } catch(error){
        console.log("New lobby error")
    }
    console.log(newLobbyData);
    lobbies.set(newLobbyData.id, newLobbyData.messages);
    res.json(newLobbyData);
});
app.post('/uploadMessage', async (req, res) => {
    //log("UPLOAD");
    const id = Number(req.body.id);
    const message = req.body.message

    //Check if message is string
    if (typeof message !== "string"){
        return res.status(400).json({
            id: id,
            status: null,
            message: ["Message must be text"]
        })
    }
    let newData;
    try{
        newData = await sendAndWaitforResponse({id: id, action: "upload", status: null, message: message});
        newData.status = "ok"
    } catch (error){
        console.log("Error");
    }

    res.json(newData);
});
app.get("/hostname", (req, res)=>{
    //log("HOSTNAME get");
    res.json({ hostName: os.hostname() });
    //log("HOSTNAME receive");
})
app.listen(API_SERVER_PORT, () => console.log(`http://localhost:${API_SERVER_PORT}`));