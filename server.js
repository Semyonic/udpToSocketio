/**
 * Created by PhpStorm.
 * File: server.js
 * User: semihonay
 * Date: 5.06.2017
 * Time: 20:12
 */
const fs = require('fs');
const mime = require('mime');

const http = require('http'),
    dgram = require('dgram'),
    socketio = require('socket.io');

const app = http.createServer(handleRequest),
    io = socketio.listen(app),
    socket = dgram.createSocket('udp4');

socket.on('listening', () => {
  let address = socket.address();
  console.log(
      'UDP Server ' + address.address + ':' + address.port);
});

socket.on('message', (content, rinfo) => {
  console.log('From', rinfo.address, rinfo.port + ' Data ' + content);
  io.sockets.emit('udp message', new Buffer(content, 'base64').toString());
});

/*function handleRequest(req, res) {

 if (req.url.indexOf('/') !== -1) {

 fs.readFile(__dirname + '/index.html', function(err, data) {
 if (err) console.log(err);
 res.writeHead(200, {'Content-Type': 'text/html'});
 res.write(data);
 res.end();
 });
 }

 if (req.url.indexOf('.js') !== -1) {

 fs.readFile(__dirname + '/node_modules/jquery/dist/jquery.min.js',
 function(err, data) {
 if (err) console.log(err);
 res.writeHead(200, {'Content-Type': 'text/javascript'});
 res.write(data);
 res.end();
 });

 fs.readFile(__dirname + '/node_modules/bootstrap/dist/js/bootstrap.min.js',
 function(err, data) {
 if (err) console.log(err);
 res.writeHead(200, {'Content-Type': 'text/javascript'});
 res.write(data);
 res.end();
 });
 }

 if (req.url.indexOf('.css') !== -1) {
 fs.readFile(__dirname + '/node_modules/bootswatch/paper/bootstrap.min.css',
 function(err, data) {
 if (err) console.log(err);
 res.writeHead(200, {'Content-Type': 'text/css'});
 res.write(data);
 res.end();
 });
 }

 }*/

function handleRequest(req, res) {
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
}

socket.bind(33333);
app.listen(3000);