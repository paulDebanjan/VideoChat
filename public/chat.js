let socket = io();
let divVideoChatLobby = document.getElementById("video-chat-lobby");
let divVideoChat = document.getElementById("video-chat-room");
let joinButton = document.getElementById("join");
let userVideo = document.getElementById("user-video");
let peerVideo = document.getElementById("peer-video");
let roomInput = document.getElementById("room-name");
let divButtonGroup = document.getElementById("button-group");

let muteButton = document.getElementById("muteButton");
let hideCameraButton = document.getElementById("hideCameraButton");
let leavRoomButton = document.getElementById("leaveRoomButton");
let presentationButton = document.getElementById("presentationButton");

let muteFlag = false;
let hideCameraFlag = false;

let roomName;
let creator = false;
let rtcPeerConnection;
let userStream;

let iceServers = {
    iceServers:[
        {urls: "stun:stun.services.mozilla.com"},
        {urls: "stun:stun.l.google.com:19302"},
    ],
} 

joinButton.addEventListener("click", function() {
    if (roomInput.value == "") {
        alert("Please Inter a room name!")
    }
    else {
        roomName = roomInput.value;
        socket.emit("join", roomName);
        
    }
});


muteButton.addEventListener("click", function() {
    muteFlag = !muteFlag;

    if(muteFlag) {
        userStream.getTracks()[0].enabled = false;
        muteButton.innerHTML = `<i class="fa-solid fa-microphone-slash fa-xl"></i>`;
    }else {
        userStream.getTracks()[0].enabled = true;
        muteButton.innerHTML = `<i class="fa-solid fa-microphone fa-xl"></i>`;
    }
});

hideCameraButton.addEventListener("click", function() {
    hideCameraFlag = !hideCameraFlag;

    if(hideCameraFlag) {
        userStream.getTracks()[1].enabled = false;
        hideCameraButton.innerHTML = `<i class="far fa-stop-circle fa-xl"></i>`;
    }else {
        userStream.getTracks()[1].enabled = true;
        hideCameraButton.innerHTML = `<i class="fa-solid fa-camera fa-xl"></i>`;
    }
});

socket.on("created", function() {
    creator = true;

    navigator.mediaDevices
    .getUserMedia({
        audio:true, 
        video:{width:500, height: 500},
    })
    .then(function(stream) {
            userStream = stream;
            divVideoChatLobby.style = "display: none";
            divButtonGroup.style = "display: block";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            };
        })
    .catch(function(err) {
            console.log(`The following error occurred: ${err.name}`);
        })
});
socket.on("joined", function() {
    creator = false;
    
    navigator.mediaDevices
    .getUserMedia({
        audio:true, 
        video:{width:500, height: 500}
    })
    .then(function(stream) {
            userStream = stream;
            divVideoChatLobby.style = "display: none";
            divButtonGroup.style = "display: block";
            userVideo.srcObject = stream;
            userVideo.onloadedmetadata = function(e) {
                userVideo.play();
            };
            socket.emit("ready", roomName);
        })
    .catch(function(err) {
            console.log(`The following error occurred: ${err.name}`);
        })
});
socket.on("full", function() {
    alert("Room is full can't join!");
});


socket.on("ready", function() {
    if (creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.createOffer(function(offer){
            rtcPeerConnection.setLocalDescription(offer);
            socket.emit("offer",offer,roomName);
        },
        function(error){
            console.log(error)
        })
    }
});
socket.on("candidate", function(candidate) {
    let iceCandidate = new RTCIceCandidate(candidate);
    rtcPeerConnection.addIceCandidate(iceCandidate);
});

socket.on("offer", function(offer) {
    if (!creator) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = OnIceCandidateFunction;
        rtcPeerConnection.ontrack = OnTrackFunction;
        rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
        rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);
        rtcPeerConnection.setRemoteDescription(offer)
        rtcPeerConnection.
        createAnswer()
        .then(function(answer){
            rtcPeerConnection.setLocalDescription(answer)
            socket.emit("answer",answer,roomName);
        })
        .catch(function(error){
            console.log(error)
        });
    }
});

socket.on("answer", function(answer) {
    rtcPeerConnection.setRemoteDescription(answer);

});

leavRoomButton.addEventListener("click", function() {
    socket.emit("leave", roomName);
    divVideoChatLobby.style = "display:block";
    divButtonGroup.style = "display: none";

    if(userVideo.srcObject) {
        userVideo.srcObject.getTracks()[0].stop();
        userVideo.srcObject.getTracks()[1].stop();
        userVideo.srcObject = null;
    }

    if(peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
        peerVideo.srcObject = null;
    }
    if(rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.onicecandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }
    roomInput.value = "";
});


socket.on("leave", function() {
    creator = true
    if(rtcPeerConnection) {
        rtcPeerConnection.ontrack = null;
        rtcPeerConnection.iceCandidate = null;
        rtcPeerConnection.close();
        rtcPeerConnection = null;
    }
    if(peerVideo.srcObject) {
        peerVideo.srcObject.getTracks()[0].stop();
        peerVideo.srcObject.getTracks()[1].stop();
        peerVideo.srcObject = null;
    }
    roomInput.value = "";
});

function OnIceCandidateFunction(event) {
    if(event.candidate) {
        socket.emit("candidate", event.candidate, roomName);
    }
};
function OnTrackFunction(event) {
    peerVideo.srcObject = event.streams[0];
    peerVideo.onloadedmetadata = function(e) {
        peerVideo.play();
    };
};
