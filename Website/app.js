const API_URL = "";
const lobbyList = [];
const lobbyPanel = document.getElementById("chat-lobbies");
const messagesArea = document.getElementById("messages");
const textArea = document.getElementById("text-input");

function highlightLobby(id){
    lobbyList.map(lobby => lobby.divElement.classList.toggle("selected", lobby.id === id));
}
async function selectLobby(id){
    highlightLobby(id);
    const messages = await fetchLobbyMessages(id);
    loadLobbyMessages(messages);
}
function loadLobbyMessages(messages){
    messagesArea.value = messages;
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
    lobbyElement.className = "chat-lobby";
    
    lobbyList.push({id: newLobby.id, divElement: lobbyElement});
    lobbyPanel.append(lobbyElement);

    lobbyElement.addEventListener("click", ()=>selectLobby(newLobby.id));
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
        alert(`Failed to get messages from id: ${id} \n${error.message}`);
        return(`Failed to get messages from id: ${id} \n${error.message}`);
        return;
    }

    if (data.status === null){
        alert(`Lobby ${id} does not exist anymore`);
        return(`Lobby ${id} does not exist anymore`)
        removeLobby(id);
        return;
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
        alert(`Failed to create new Lobby\n${error.message}`);
        return;
    }

    if (data.status === null){
        alert("Unable to create a new lobby");
        return;
    }

    addLobbytoList(data);
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

    if (data.status === null){
        alert("Lobby does not exit");
        return;
    }

    addLobby(data);
}
document.querySelector("#create-lobby").addEventListener("click", createLobby);
document.querySelector("#search-lobby").addEventListener("click", searchLobby);
textArea.addEventListener("input", (event) => {
    textArea.style.height = "auto";
    textArea.style.height = `${textArea.scrollHeight}px`;
});
textArea.addEventListener("keydown", (event)=>{
    if (event.key === "Enter" && !event.shiftKey){
        event.preventDefault();

        const message = textArea.value;
        textArea.value = "";
        
        //sentMessage(message);
        alert(message);
        loadLobbyMessages(message);
        return;
    }
})
window.onload = ()=>{
    for (let i = 0; i < 12; i++)
        addLobbytoList({id: 1000+i, messages: 'sdifjsfslkfsef'});
}