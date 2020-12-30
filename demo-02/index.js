'use strict';

var os = require('os');
var nodeStatic = require('node-static');
var http = require('http');
var socketIO = require('socket.io');

var fileServer = new (nodeStatic.Server)();
var app = http.createServer(function (req, res) {
  fileServer.serve(req, res);
}).listen(8080);

var io = socketIO.listen(app);
io.sockets.on('connection', function (socket) {

  socket.on('message', function (message) {
    console.log('Client said: ', message);
    socket.broadcast.emit('message', message);
  });

  socket.on('create or join', function (room) {
    console.log('Received request to create or join room ' + room);

    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log('Room ' + room + ' now has ' + numClients + ' client(s)');

    if (numClients === 0) {
      socket.join(room);
      console.warn('Client ID ' + socket.id + ' created room ' + room);
      socket.emit('created', room, socket.id);
    } else if (numClients === 1) {
      console.warn('Client ID ' + socket.id + ' joined room ' + room);
      socket.join(room);
      socket.emit('joined', room, socket.id);
      socket.broadcast.emit('ready', room);
    } else { // max two clients
      socket.emit('full', room);
    }
  });

  socket.on('disconnect', function (reason) {
    console.log(`Peer or server disconnected. Reason: ${reason}.`);
    socket.broadcast.emit('bye');
  });

  socket.on('bye', function (room) {
    console.log(`Peer said bye on room ${room}.`);
  });
});
