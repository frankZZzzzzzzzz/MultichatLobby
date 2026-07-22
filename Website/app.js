const API_URL = "";
const lobbyList = [];
const lobbyPanel = document.getElementById("chat-lobbies");
const messagediv = document.getElementById("message-area");

function switchMessages(messages){
    messagediv.textContent = messages;
}
function removeLobby(id){
    const index = lobbyList.findIndex(lobby => lobby.id == id);

    if (index == -1)
        return;

    lobbyList[index].divElement.remove();
    lobbyList.splice(index, 1);
}
function addLobby(newLobby){
    if (lobbyList.findIndex(lobby => lobby.id === newLobby.id) !== -1){
        switchMessages(newLobby.messages);
        return;
    }

    const lobbyElement = document.createElement("div");
    lobbyElement.textContent = newLobby.id;
    lobbyElement.id = newLobby.id;
    
    lobbyList.push({id: newLobby.id, divElement: lobbyElement})
    lobbyPanel.append(lobbyElement)

    lobbyElement.addEventListener("click", ()=>fetchLobbyMessages(newLobby.id))
    switchMessages(newLobby.messages);
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
        return;
    }

    if (data.status === null){
        alert(`Lobby ${id} does not exist anymore`);
        removeLobby(id);
        return;
    }
    switchMessages(data.messages)
}
async function createLobby(){
    let data;
    try{
        const response = await fetch(`${API_URL}/newLobby`);

        if (!response.ok)
            throw new Error("Server returned: " + response.status)

        data = await response.json()
    } catch (error){
        alert(`Failed to create new Lobby\n${error.message}`);
        return;
    }

    if (data.status === null){
        alert("Unable to create a new lobby");
        return;
    }

    addLobby(data);
}
async function searchLobby(){
    const id = prompt("Please Enter a Lobby ID:");

    if (id === null)
        return;

    let data;
    try{
        const params = new URLSearchParams({id: id })
        const response = await fetch(`${API_URL}/getMessages?${params}`);
        
        if (!response.ok)
            throw new Error("Server returned: " + response.status)

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
document.querySelector("#create-lobby").addEventListener("click", createLobby)
document.querySelector("#search-lobby").addEventListener("click", searchLobby)
