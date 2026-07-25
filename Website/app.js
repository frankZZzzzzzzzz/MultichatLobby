const API_URL = "";
const lobbyList = [];
const lobbyPanel = document.getElementById("chat-lobbies");
const messagesArea = document.getElementById("messages");
const textArea = document.getElementById("text-input");
const refreshInput = document.getElementById("set-refresh-time");

let selectedLobbyId = -1;

let refreshMessageTime = 500;
let refreshMessagePoller = null;

function highlightLobby(id){
    if (selectedLobbyId != -1)
        lobbyList.find(lobby => lobby.id === selectedLobbyId).divElement.classList.toggle("selected", false);

    selectedLobbyId = id;
    lobbyList.find(lobby => lobby.id === id).divElement.classList.toggle("selected", true);
}
async function selectLobby(id){
    const data = await fetchLobbyMessages(id);
    loadLobbyMessages(data.messages);
    if (data.status === "found")
        highlightLobby(id);
    
    if (refreshMessagePoller === null){
        refreshMessages();
    }
}
function loadLobbyMessages(messages){
    messagesArea.value = "";
    messages.forEach(message => messagesArea.value += message + '\n');
    messagesArea.scrollTo({
        top: messagesArea.scrollHeight,
        behavior: "smooth"
    })
}
function removeLobbyfromList(id){
    const index = lobbyList.findIndex(lobby => lobby.id == id);

    if (index == -1)
        return;

    lobbyList[index].divElement.remove();
    lobbyList.splice(index, 1);
}
function addLobbytoList(newLobby){
    loadLobbyMessages(newLobby.messages);

    if (lobbyList.findIndex(lobby => lobby.id === newLobby.id) !== -1)
        return;

    const lobbyElement = document.createElement("button");
    lobbyElement.textContent = `id: ${newLobby.id}`;
    lobbyElement.id = newLobby.id;
    lobbyElement.className = "chat-lobby-button";
    
    lobbyList.push({id: newLobby.id, divElement: lobbyElement});
    lobbyPanel.append(lobbyElement);

    lobbyElement.addEventListener("click", ()=>selectLobby(newLobby.id));
    lobbyElement.offsetHeight;
}
async function fetchLobbyMessages(id){
    let data;
    try{
        const params = new URLSearchParams({ id: id })
        const response = await fetch(`${API_URL}/getMessages?${params}`);

        if (!response.ok)
            throw new Error("Server returned: " + response.status)

        data = await response.json();
    } catch(error){
        selectedLobbyId = -1;
        alert(`Failed to get messages from id: ${id} \n${error.message}`);
        return(`Failed to get messages from id: ${id} \n${error.message}`);
        return;
    }

    if (data.status !== "found"){
        removeLobbyfromList(id);
        selectedLobbyId = -1;
        alert(`Lobby ${id} does not exist anymore`);
        return({id: id, status: null, messages: [`Lobby ${id} does not exist anymore`]});
    }
    return (data)
}
async function createLobby(){
    let data;
    try{
        const response = await fetch(`${API_URL}/newLobby`);

        if (!response.ok)
            throw new Error("Server returned: " + response.status);

        data = await response.json();
    } catch (error){
        alert(`Failed to create new Lobby: \n${error.message}`);
        return;
    }

    if (data.status !== "created"){
        alert("Unable to create a new lobby");
        return;
    }

    console.log(data);
    addLobbytoList(data);
    selectLobby(data.id);
}
async function searchLobby(){
    const id = prompt("Please Enter a Lobby ID:");

    if (id === null)
        return;

    let data;
    try{
        const params = new URLSearchParams({id: id });
        const response = await fetch(`${API_URL}/getMessages?${params}`);
        
        if (!response.ok)
            throw new Error("Server returned: " + response.status);

        data = await response.json();
    } catch (error){
        alert(`Error in searching: ${error.message}`);
        return;
    }

    if (data.status !== "found"){
        alert("Lobby does not exit");
        return;
    }

    addLobbytoList(data);
    selectLobby(data.id);
}
async function uploadMessage(message){
    if (selectedLobbyId === -1){
        alert("Select a lobby before uploading");
        return;
    }
    
    const response = await fetch(`${API_URL}/uploadMessage`,{
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            id: selectedLobbyId,
            message: message,
        })
    });
    const data = await response.json();
    if (data.status !== "ok"){
        alert("Something went wrong with upload");
        return;
    }

    textArea.value = "";
    
    const newdata = await fetchLobbyMessages(selectedLobbyId);
    loadLobbyMessages(newdata.messages);
}
async function refreshMessages(){
    console.log("refreshed");
    if (selectedLobbyId === -1){
        clearInterval(refreshMessagePoller);
        refreshMessagePoller = null;
        return;
    }
    const data = await fetchLobbyMessages(selectedLobbyId);
    
    if (data.status === "ok")
        loadLobbyMessages(data.messages);
    refreshMessagePoller = setTimeout(refreshMessages, refreshMessageTime)
}
function changeRefreshTime(ms){
    refreshMessageTime = ms;
}
document.querySelector("#create-lobby").addEventListener("click", createLobby);
document.querySelector("#search-lobby").addEventListener("click", searchLobby);
refreshInput.addEventListener("change", (event)=>{
    event.preventDefault();
    const input = Number(event.target.value);

    if (event.target.value === "")
        refreshMessageTime = 500;
    else if (input < 100)
        refreshMessageTime = 100;
    else
        refreshMessageTime = input;

    event.target.value = refreshMessageTime;
});
refreshInput.addEventListener("input", (event)=>{
    event.target.value = event.target.value.replace(/[^0-9]/g, "");
});
textArea.addEventListener("input", (event) => {
    textArea.style.height = "auto";
    textArea.style.height = `${textArea.scrollHeight}px`;
});
textArea.addEventListener("keydown", (event)=>{
    if (event.key === "Enter" && !event.shiftKey){
        event.preventDefault();

        const message = textArea.value.trim();
        if (message === "")
            return;

        textArea.value = "";
        
        uploadMessage(message);
        return;
    }
});
window.addEventListener("load", ()=>{
    addLobbytoList({id: 1000, messages: ['sdifjsfslkfsef']});
    refreshInput.value = refreshMessageTime;
    refreshMessages();
});
window.addEventListener("beforeunload", ()=>{
    if (refreshMessagePoller !== null)
        clearInterval(refreshMessagePoller);
});
