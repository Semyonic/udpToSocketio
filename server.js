/**
 * User: semihonay
 * File: server.js
 * Date: 8.06.2017
 */
var udpGen = require('./udpMessageGenerator/udpSender');
var fetch = require('node-fetch');
var path = require('path');
var express = require('express')
    , app = express()
    , ejs = require('ejs')
    , http = require('http')
    , https = require('https')
    , server = http.createServer(app).listen(3000)
    , io = require('socket.io').listen(server);

var dgram = require('dgram');
var UDPclient = dgram.createSocket('udp4').bind(33333);

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
// routing
app.get('/', (req, res, next) => {
  res.render('index', {title: 'Express'});
});

app.get('/screen10', (req, res, next) => {
  res.render('screen10', {title: 'Screen-10'});
});

app.get('/screen11', (req, res, next) => {
  res.render('screen11', {title: 'Screen-11'});
});

app.get('/screen12', (req, res, next) => {
  res.render('screen12', {title: 'Screen-12'});
});

//JS libraries
app.get('/config.json', (req, res, next) => {
  res.sendFile(__dirname + '/config.json');
});
app.get('/xterm', (req, res, next) => {
  res.sendFile(__dirname + '/public/terminal.html');
});
app.get('/main.js', (req, res, next) => {
  res.sendFile(__dirname + '/main.js');
});
app.get('/bootstrap.min.css', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/bootswatch/slate/bootstrap.min.css');
});
app.get('/jquery.min.js', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/jquery/dist/jquery.min.js');
});
app.get('/bootstrap.min.js', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js');
});
app.get('/animate.min.css', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/animate.css/animate.min.css');
});
app.get('/bootstrap-notify.js', (req, res, next) => {
  res.sendFile(
      __dirname + '/node_modules/bootstrap-notify/bootstrap-notify.js');
});
app.get('/xterm.js', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/xterm/dist/xterm.js');
});
app.get('/xterm.css', (req, res, next) => {
  res.sendFile(__dirname + '/node_modules/xterm/dist/xterm.css');
});

function makeid() {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < 5; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));

  return text;
}

setInterval(() => {
  udpGen.sendMessage('screen10', {id: makeid(), room: 'home'});
  udpGen.sendMessage('screen10', {id: makeid(), room: 'screen10'});
  udpGen.sendMessage('screen11', {id: makeid(), room: 'screen11'});
  udpGen.sendMessage('screen12', {id: makeid(), room: 'screen12'});
}, 500);
// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['home', 'screen10', 'screen11', 'screen12'];
var currentRoom;

UDPclient.on('message', data => {
  let payload = new Buffer(data, 'base64').toString();
  let payloadJSON = JSON.parse(payload);
  io.sockets.in(payloadJSON.room).emit('message', payloadJSON);
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
    socket.emit('updatechat',
        'Connected to ' + socket.room + ' as ' + userInfo.username);
    // echo to room 1 that a person has connected to their room
    console.log(socket.room);
    socket.broadcast.to(socket.room).
        emit('updatechat', userInfo.username + ' has connected');
    socket.emit('updaterooms', rooms, socket.room);
  });

  // when the client emits 'sendchat', this listens and executes
  socket.on('sendchat', data => {
    // we tell the client to execute 'updatechat' with 2 parameters
    io.sockets.in(socket.room).emit('updatechat', socket.username, data);
  });

  socket.on('message', data => {
    io.sockets.in(socket.room).emit('message', data);
  });

  socket.on('users', () => {
    console.log('getUsers');
    socket.emit(socket.username);
  });

  socket.on('switchRoom', newroom => {
    socket.leave(socket.room);
    socket.join(newroom);
    currentRoom = newroom;
    socket.emit('updatechat', 'Room :' + newroom + ' as ' + socket.username);
    // sent message to OLD room
    socket.broadcast.to(socket.room).
        emit('updatechat', socket.username + ' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(newroom).
        emit('updatechat', socket.username + ' has joined this room');
    socket.emit('updaterooms', rooms, newroom);
  });

  // when the user disconnects.. perform this
  socket.on('disconnect', () => {
    // remove the username from global usernames list
    delete usernames[socket.username];
    socket.leave(socket.room);
    // update list of users in chat, client-side
    io.sockets.emit('updateusers', usernames);
    // echo globally that this client has left
    io.sockets.in(socket.room).
        emit('updatechat', socket.username + ' has dissconnected');
    //socket.broadcast.emit('updatechat', socket.username + ' has disconnected');
    socket.leave(socket.room);
  });

});
