#!/usr/bin/env node

/**
 * term.js
 * Copyright (c) 2012-2013, Christopher Jeffrey & Google Inc. (MIT License)
 */

var http = require('http'),
  express = require('express'),
  pty = require('pty.js'),
  terminal = require('../');

/**
 * term.js
 */

process.title = 'term.js';

/**
 * Dump
 */

var stream;
if (process.argv[2] === '--dump') {
  stream = require('fs').createWriteStream(__dirname + '/dump.log');
}

/**
 * App & Server
 */

var app = express(),
    server = http.createServer(app),
    io = require('socket.io')(
      server, {transports: ['xhr-polling', 'polling', 'flashsocket',
                            'htmlfile', 'jsonp-polling']});

app.use(function(req, res, next) {
  var setHeader = res.setHeader;
  res.setHeader = function(name) {
    switch (name) {
      case 'Cache-Control':
      case 'Last-Modified':
      case 'ETag':
        return;
    }
    return setHeader.apply(res, arguments);
  };
  next();
});

app.use(express.static(__dirname));
app.use(terminal.middleware());

if (!~process.argv.indexOf('-n')) {
  server.on('connection', function(socket) {
    var address = socket.remoteAddress;
    if (address !== '127.0.0.1' && address !== '::1') {
      try {
        socket.destroy();
      } catch (e) {;
      }
      console.log('Attempted connection from %s. Refused.', address);
    }
  });
}

var port = 8081;

var portOption = process.argv.indexOf('--port');
if (portOption >= 0) {
  port = process.argv[portOption + 1];
}
console.log('Server is going to listen on port: ' + port);

server.listen(port);

function sendHeartbeat(){
  io.sockets.emit('ping', { beat : 1 });
}
setInterval(sendHeartbeat, 10000);

/**
 * Sockets
 */
io.sockets.on('connection', function(sock) {
  /**
   * Open Terminal
   */

  var buff = [],
    socket = sock,
    term;

  term = pty.fork('bash', ['--login'], {
    name: require('fs').existsSync('/usr/share/terminfo/x/xterm-256color') ?
      'xterm-256color' : 'xterm',
    cols: 80,
    rows: 24,
    cwd: process.env.HOME
  });

  term.on('data', function(data) {
    if (stream) stream.write('OUT: ' + data + '\n-\n');
    return !socket ? buff.push(data) : socket.emit('data', data);
  });

  console.log('' + 'Created shell with pty master/slave' + ' pair (master: %d, pid: %d)',
    term.fd, term.pid);

  socket.on('data', function(data) {
    if (stream) stream.write('IN: ' + data + '\n-\n');
    //console.log(JSON.stringify(data));
    term.write(data);
  });

  socket.on('resize', function(options) {
    term.resize(options.cols, options.rows);
  });

  socket.on('disconnect', function() {
    socket = null;
    console.log('Disconnect signal.');
    term.destroy();
  });

  while (buff.length) {
    socket.emit('data', buff.shift());
  }
});
