'use strict';

const socket = io('/');
const mPeer = new Peer(undefined, {
    host: '/',
    port: '3001'
});

const peers = {};

const videoGrid = document.getElementById('video-grid');
const mVideo = document.createElement('video');
mVideo.muted = true;


navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true,
}).then((stream) => {

    addVideoStream(mVideo, stream);

    mPeer.on('call', (call) => {
        call.answer(stream);

        const userVideo = document.createElement('video');
        userVideo.muted = true;

        call.on('stream', (userStream) => {
            addVideoStream(userVideo, userStream);
        });
    });

    socket.on('user-connected', (userId) => {
        console.log('User Connected: ' + userId);

        connectToNewUser(userId, stream);
    });

}).catch((err) => {
    alert("getUserMedia Error. " + err);
});

socket.on('user-disconnected', (userId) => {
    console.log('User Disconnected: ' + userId);
    if (peers[userId]) {
        peers[userId].close();
        peers[userId] = undefined;
    }
});

mPeer.on('open', (id) => {
    socket.emit('join-room', ROOM_ID, id);
});

function addVideoStream(video, stream) {
    video.srcObject = stream;
    video.addEventListener('loadedmetadata', () => {
        video.play();
    });
    videoGrid.append(video);
}

function connectToNewUser(userId, stream) {
    const call = mPeer.call(userId, stream);

    const userVideo = document.createElement('video');
    userVideo.muted = true;

    call.on('stream', (userStream) => {
        addVideoStream(userVideo, userStream);
    });

    call.on('close', () => {
        userVideo.remove();
    });

    peers[userId] = call;
}