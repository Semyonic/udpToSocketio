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
  udpGen.sendMessage({id: makeid(), room: 'home'});
  udpGen.sendMessage({id: makeid(), room: 'screen10'});
  udpGen.sendMessage({id: makeid(), room: 'screen11'});
  udpGen.sendMessage({id: makeid(), room: 'screen12'});
}, 3000);

var usernames = {};
var rooms = ['screen10', 'screen11', 'screen12'];

UDPclient.on('message', data => {
  let payload = new Buffer(data, 'base64').toString();
  let payloadJSON = JSON.parse(payload);
  io.sockets.in(payloadJSON.room).emit('message', payloadJSON);
});

// socket.io events
io.sockets.on('connection', socket => {

  socket.on('adduser', userInfo => {

    socket.username = userInfo.username;
    socket.room = userInfo.room;
    usernames[userInfo.username] = userInfo.username;
    socket.join(userInfo.room);

    socket.emit('updatechat', 'SERVER',
        'Connected to ' + socket.room + ' as ' + userInfo.username);

    socket.broadcast.to(socket.room).
        emit('updatechat', 'SERVER',
            userInfo.username + ' has connected to this room');
    socket.emit('updaterooms', rooms, socket.room);
  });

  socket.on('message', data => {
    io.sockets.in(socket.room).emit('getUDPdata', data);
  });

  socket.on('switchRoom', newroom => {
    socket.leave(socket.room);
    socket.join(newroom);
    socket.emit('updatechat', 'SERVER',
        'Connected to ' + newroom + ' as ' + socket.username);
    // sent message to OLD room
    io.sockets.in(socket.room).
        emit('updatechat', 'SERVER', socket.username + ' has left this room');
    // update socket session room title
    socket.room = newroom;
    socket.broadcast.to(socket.room).
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
    io.sockets.in(socket.room).emit('updatechat', 'SERVER',
        socket.username + ' has disconnected');
    socket.leave(socket.room);
  });

});
