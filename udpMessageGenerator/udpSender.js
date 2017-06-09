/**
 * User: semihonay
 * File: udpSender.js
 * Date: 8.06.2017
 */

function parseXml(xml) {
  var DOMParser = require('xmldom').DOMParser;
  try {
    return new DOMParser().parseFromString(xml, 'text/xml');
  }
  catch (e) {
    return null;
  }
}

var sendUDP = () => {
  var PORT = 33333;
  var HOST = '127.0.0.1';

  var dgram = require('dgram');

  var fetch = require('node-fetch');

  /*fetch('http://www.cnnturk.com/feed/rss/all/news',{mode:'no-cors'}).then(function(response){
   return JSON.stringify(parseXml(response.text()));
   })
   .then(function(text){
   console.log(text);
   });*/

  /*fetch('http://www.cnnturk.com/feed/rss/all/news', {mode: 'no-cors'}).
   then(response =>{
   // Convert to JSON
   return response.json();
   }).
   then(j =>{
   // Yay, `j` is a JavaScript object
   console.log(j);
   });*/

  var message = new Buffer(JSON.stringify({name: 'test'}));

  var client = dgram.createSocket('udp4');
  client.send(message, 0, message.length, PORT, HOST, (err, bytes) => {
    if (err) throw err;
    console.log('UDP message sent to ' + HOST + ':' + PORT);
    client.close();
  });
};

exports.sendMessage = sendUDP;