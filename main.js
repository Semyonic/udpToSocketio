/**
 * User: semihonay
 * File: main.js
 * Date: 8.06.2017
 */
fetch('http://www.cnnturk.com/feed/rss/all/news', {mode: 'no-cors'}).
    then(response => {
      // Convert to JSON
      return response.json();
    }).then(json => {

  var socket = io.connect(json.remoteWebServer.ip + json.remoteWebServer.port);
// on connection to server, ask for user's name with an anonymous callback
  socket.on('connect', () => {
    // call the server-side function 'adduser' and send one parameter (value of prompt)
    socket.emit('adduser', {username: socket.id, room: window.location.href});
  });
// listener, whenever the server emits 'updatechat', this updates the chat body
  socket.on('updatechat', (username, data) => {
    jQuery('#conversation').append('<b>' + username + ':</b> ' + data + '<br>');
  });
// listener, whenever the server emits 'updaterooms', this updates the room the client is in
  socket.on('updaterooms', (rooms, current_room) => {
    jQuery('#rooms').empty();
    jQuery.each(rooms, (key, value) => {
      if (value === current_room) {
        jQuery('#rooms').append('<div>' + value + '</div>');
      }
      else {
        jQuery('#rooms').
            append('<div><a href="#" onclick="switchRoom(\'' + value + '\')">' +
                value + '</a></div>');
      }
    });
  });

  socket.on('message', (data) => {
    jQuery('#conversation').
        append('<b>UDP Message</b> ' + JSON.stringify(data) + '<br>');
  });

  var timeout;

  function timeoutFunction() {
    typing = false;
    socket.emit('typing', false);
  }

  jQuery('.typing-message').keyup(function() {
    console.log('happening');
    typing = true;
    socket.emit('typing', 'typing...');
    clearTimeout(timeout);
    timeout = setTimeout(timeoutFunction, 2000);
  });

  socket.on('typing', function(data) {
    if (data) {
      jQuery('.typing').html(data);
    } else {
      jQuery('.typing').html('');
    }
  });

  function switchRoom(room) {
    jQuery('#conversation').empty();
    socket.emit('switchRoom', room);
  }

// on load of page
  jQuery(function() {
    // when the client clicks SEND
    jQuery('#datasend').click(() => {
      var message = jQuery('#data').val();
      jQuery('#data').val('');
      // tell server to execute 'sendchat' and send along one parameter
      socket.emit('sendchat', message);
    });
    // when the client hits ENTER on their keyboard
    jQuery('#data').keypress(function(e) {
      if (e.which === 13) {
        jQuery(this).blur();
        jQuery('#datasend').focus().click();
      }
    });
  });
});