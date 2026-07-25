require("dotenv").config();

const path = require("path");
const express = require("express");

const app = express();
let offset = 0;
const Lobbies = new Map();
const MAX_MESSAGES = process.env.MAX_STORED_MESSAGES || 1000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "../Website")));

app.get('/getMessages', (req, res) => {
    const id = Number(req.query.id);

    if (!Lobbies.has(id)){
        res.send({
            id: id,
            status: null,
            messages: "IDK",
        });
        return;
    }
    res.send({
        id: id,
        status: "found",
        messages: Lobbies.get(id),
    });
    console.log("MEssage");
});
app.get('/newLobby', (req, res) =>{
    const data = {
        id: offset,
        status: "created",
        messages: [`Lobby #: ${offset} first message!`],
    }
    offset++;

    Lobbies.set(data.id, data.messages);
    res.json(data);
    console.log("New");
});
app.post('/uploadMessage', (req, res) => {
    const id = Number(req.body.id);
    const message = req.body.message
    if (!Lobbies.has(id))
        return res.json({id: id, status: null, messages: [`Lobby ${id} doesn't exist`]});
    if (typeof message !== "string"){
        return res.status(400).json({
            id: id,
            status: null,
            message: ["Message must be text"]
        })
    }

    const messageArray = Lobbies.get(id);
    messageArray.push(message);
    if (messageArray.length > 50)
        messageArray.shift();

    res.json({id: id, status: "ok", messages: ["idk"]});
});
app.listen(process.env.PORT || 3000, () => console.log('http://localhost:3000'));