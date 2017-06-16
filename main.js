/**
 * User: semihonay
 * File: main.js
 * Date: 8.06.2017
 */
//fetch('config.json').then(function(response) {
    // Convert to JSON
//  return response.json();
//}).then(function(json) {

    //var socket = io.connect(json.ip);
var socket = io.connect(window.location.origin, {path: '/app1/socket.io/'});
// on connection to server, ask for user's name with an anonymous callback
socket.on('connect', () => {
  // call the server-side function 'adduser' and send one parameter (value of prompt)
  if (window.location.pathname === '/app1/home') {
    socket.emit('adduser', {username: socket.id, room: 'home'});
  } else {
    socket.emit('adduser',
        {username: socket.id, room: window.location.pathname.substr(1)});
  }
});

function showUsers() {
  socket.on('users', (users) => {
    console.log(users);
  });
}

// listener, whenever the server emits 'updatechat', this updates the chat body
socket.on('updatechat', (username, data) => {
  jQuery.notify(data, {
    newest_on_top: true,
    type: 'success',
    animate: {
      enter: 'animated fadeInRight',
      exit: 'animated fadeOutRight',
    },
  });
});

socket.on('message', (data) => {
  var tableId = '#udpData';
  var tbody = $(tableId).children('tbody');
  var table = tbody.length ? tbody : $(tableId);

  table.append(
      '<tr><td>' + data.id + '</td><td>' + data.room + '</td><td>');
  // Auto-scorll after added data into table
  window.scrollTo(0, document.body.scrollHeight);

});

function switchRoom(room) {
  socket.emit('switchRoom', room);
  $('#udpBody').empty();
}
//});