require("dotenv").config();

const net = require("net");

const express = require("express");
const path = require("path");
const os = require("os");
const hostName = os.hostname();

const DATABASE_PORT = Number(process.env.DATABASE_PORT) || 3000;
const DATABASE_IP = process.env.DATABASE_IP || "localhost"
const API_SERVER_PORT = Number(process.env.API_SERVER_PORT) || 3000;
const RETRY_INTERVAL = Number(process.env.RETRY_INTERVAL) || 10_000;

//Local Cache
const lobbies = new Map();

//TCP connect to Server
const specificRequests = new Map();
let client = null;
let responseIDCounter = 0;
let connected = false;

function log(message){
    console.log(`${(new Date).toISOString()}: ${message}`);
}
function startRetryConnecting(){
    setInterval(()=>client = net.createConnection(DATABASE_PORT, DATABASE_IP), 10_000);
}
function connectToDatabase(){
    if (client)
        client.destroy();

    client = net.createConnection(DATABASE_PORT, DATABASE_IP);

    client.on("connect", async ()=>{
        connected = true;

        lobbies.clear();
        console.log("Connected");

        //Get Cache 
        const cacheData = await sendAndWaitforResponse({action: "load Cache"});
        Object.entries(cacheData.lobbies).forEach(([id, messages])=>{
            lobbies.set(Number(id), messages);
        })
        console.log(lobbies)
    });

    //Handles Incoming data
    let dataInBuffer = "";
    client.on("data", (data)=>{
        dataInBuffer += data.toString();
        const messages = dataInBuffer.split("\n");
        dataInBuffer = messages.pop();
        
        messages.forEach((message)=>{
            const lobbyInfo = JSON.parse(message);
            handleAction(lobbyInfo);
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
        tryReconnecting();
    });
}
function tryReconnecting(){
    if (connected)
        return;

    log(`Attempting to connect in ${RETRY_INTERVAL/1000} seconds`);
    setTimeout(()=>connectToDatabase(), RETRY_INTERVAL);
} 
function handleAction(lobbyInfo){
    log(`Handling message by/for ${lobbyInfo.requestID || lobbyInfo.action || "Neither"}`);
    log(JSON.stringify(lobbyInfo));

    //Handle specific requests/responses
    if (lobbyInfo.requestId !== undefined){
        log("Specific Request")
        specificRequests.get(lobbyInfo.requestId).resolve(lobbyInfo);
        specificRequests.delete(lobbyInfo.requestId);
    } //Handle broad responses
    else{
        log("Broad Request");
        switch(lobbyInfo.action){
            case "updatedMessages":
                log("Updated Messages")
                lobbies.set(Number(lobbyInfo.id), lobbyInfo.messages);
                log(JSON.stringify(lobbies.get(Number(lobbyInfo.id))));
                break;
            case "newLobby":
                log("New Lobby")
                lobbies.set(Number(lobbyInfo.id), lobbyInfo.messages);
                log(JSON.stringify(lobbies.get(Number(lobbyInfo.id))));
                break;
            default:
                log("Somehow reached the end");
        }
    }
}
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
                log(data);
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
    lobbies.set(Number(newLobbyData.id), newLobbyData.messages);
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
    lobbies.set(Number(newData.id), newData.messages);
    res.json(newData);
});
app.get("/hostname", (req, res)=>{
    //log("HOSTNAME get");
    res.json({ hostName: hostName });
    //log("HOSTNAME receive");
})

connectToDatabase();
app.listen(API_SERVER_PORT, () => console.log(`http://localhost:${API_SERVER_PORT}`));