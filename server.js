/**
 * User: semihonay
 * File: server.js
 * Date: 8.06.2017
 */
const conifg = require('./config.js');
console.log(conifg);
var udpGen = require('./udpMessageGenerator/udpSender');
var fetch = require('node-fetch');
var express = require('express')
    , app = express()
    , http = require('http')
    , server = http.createServer(app).listen(conifg.remoteWebServer.port)
    , io = require('socket.io').listen(server);

var dgram = require('dgram');
var UDPclient = dgram.createSocket('udp4').bind(33333);
// routing
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});
app.get('/main.js', (req, res) => {
  res.sendFile(__dirname + '/main.js');
});
app.get('/jquery.min.js', (req, res) => {
  res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});

setInterval(() => {
  udpGen.sendMessage();
}, 3000);
// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['livescreen10', 'livescreen11', 'livescreen12'];
var currentRoom;

UDPclient.on('message', data => {
  let payload = new Buffer(data, 'base64').toString();
  let payloadJSON = JSON.parse(payload);
  //io.sockets.emit('message', payloadJSON);
  io.sockets.in(currentRoom).emit('message', usernames);
});

// socket.io events
io.sockets.on('connection', socket => {

  // when the client emits 'adduser', this listens and executes
  socket.on('adduser', userInfo => {
    // store the username in the socket session for this client
    socket.username = userInfo.username;
    // store the room name in the socket session for this client
    socket.room = userInfo.room;
    currentRoom = userInfo.room;
    // add the client's username to the global list
    usernames[userInfo.username] = userInfo.username;
    // send client to room 1
    socket.join(userInfo.room);
    // echo to client they've connected
    socket.emit('updatechat', 'SERVER',
        'you have connected to ' + socket.room + ' as ' + userInfo.username);
    // echo to room 1 that a person has connected to their room
    socket.broadcast.to(socket.room).
        emit('updatechat', 'SERVER',
            userInfo.username + ' has connected to this room');
    socket.emit('updaterooms', rooms, socket.room);
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', data => {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('message', data => {
    io.sockets.in(socket.room).emit('getUDPdata', data);
  });

  socket.on('switchRoom', newroom => {
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER',
        'you have connected to ' + newroom + ' as ' + socket.username);
    // sent message to OLD room
    socket.broadcast.to(socket.room).
        emit('updatechat', 'SERVER', socket.username + ' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).
        emit('updatechat', 'SERVER', socket.username + ' has joined this room');
    socket.emit('updaterooms', rooms, newroom);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    // remove the username from global usernames list
    delete usernames[socket.username];
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    socket.broadcast.emit('updatechat', 'SERVER',
        socket.username + ' has disconnected');
    socket.leave(socket.room);
  });

});

/*function handleRequest(req, res) {
 fs.readFile('./index.html', 'utf-8', (error, content) => {
 let url = req.url;
 let mimeType = mime.lookup(url.substring(url.indexOf('.')));

 switch (mimeType) {
 case 'text/css':
 res.writeHead(200, {'Content-Type': mimeType});
 fs.readFile(
 __dirname + '/node_modules/bootswatch/paper/bootstrap.min.css',
 (err, data) => {
 res.write(data);
 res.end();
 });
 break;
 case 'application/javascript':
 res.writeHead(200, {'Content-Type': mimeType});
 if (url.indexOf('jquery') === 1) {
 fs.readFile(
 __dirname + '/node_modules/jquery/dist/jquery.min.js',
 (err, data) => {
 res.write(data);
 res.end();
 });

 } else {
 console.log('Bootstrap = ', url.indexOf('bootstrap'));
 fs.readFile(
 __dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js',
 (err, data) => {
 res.write(data);
 res.end();
 });
 }
 break;
 case 'image/x-icon':
 console.log('Favicon yok');
 break;
 default:
 res.writeHead(200, {'Content-Type': 'text/html'});
 res.write(content);
 res.end();
 }
 });
 }*/
