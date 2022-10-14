const express = require("express");
const socket = require("socket.io")
const app = express()


let server = app.listen(4000)

app.use(express.static("public"))

let io = socket(server);

io.on("connection", function(socket) {
    console.log("User Connected: " + socket.id);

    socket.on("join", function(roomName) {
        let rooms = io.sockets.adapter.rooms;
        let room = rooms.get(roomName)
        console.log(room)
        if (room == undefined){
            socket.join(roomName)
            socket.emit("created")
        } else if (room.size == 1) {
            socket.join(roomName)
            socket.emit("joined")
        } else {
            socket.emit("full")
        }
        console.log(rooms);
    });
    socket.on("ready", function(roomName) {
        console.log("ready");
        socket.broadcast.to(roomName).emit("ready")
    });
    socket.on("candidate", function(candidate,roomName) {
        console.log(candidate);
        socket.broadcast.to(roomName).emit("candidate",candidate)
    });
    socket.on("offer", function(offer,roomName) {
        console.log(offer);
        socket.broadcast.to(roomName).emit("offer",offer)
    });
    socket.on("answer", function(answer,roomName) {
        console.log("answer");
        socket.broadcast.to(roomName).emit("answer",answer)
    });
    socket.on("leave", function(roomName) {
        socket.leave(roomName);
        socket.broadcast.to(roomName).emit("leave");
    });
});