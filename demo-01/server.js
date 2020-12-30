const express = require('express');
const { v4: uuidV4 } = require('uuid');
const https = require('https');
const socket = require('socket.io');
const pem = require('pem');
const { PeerServer } = require('peer');


pem.createCertificate({days: 1, selfSigned: true}, function(err, keys) {
    var options = {
      key: keys.serviceKey,
      cert: keys.certificate
    };
  
    const peerServer = PeerServer({ 
        port: 3001, 
        ssl: {
            key: keys.serviceKey,
            cert: keys.certificate
          }
    });

    const app = express();
    const server = https.createServer(options, app);
    const io = socket(server);

    app.set('view engine', 'ejs');
    app.use(express.static('public'));
    
    app.get('/', (req, res) => {
        res.redirect(`/${uuidV4()}`);
    });
    
    app.get('/:room', (req, res) => {
        res.render('room', { roomId: req.params.room });
    });
    
    
    io.on('connection', socket => {
        socket.on('join-room', (roomId, userId) => {
            console.log(roomId, userId);
            socket.join(roomId);
            socket.to(roomId).broadcast.emit('user-connected', userId);
    
            socket.on('disconnect', () => {
                socket.to(roomId).broadcast.emit('user-disconnected', userId);
            });
        });
    });
    
    
    // Create an HTTPS service.
    server.listen(3000);
  
    console.log('serving on https://localhost:3000');
  });
