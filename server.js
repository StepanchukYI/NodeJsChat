var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
require('route.js');
require('functions.js');
users = [];
connections = [];
messages = [];

app.use(express.static(__dirname + '/public'));

server.listen(process.env.PORT || 3000);
logging('Server started...');
console.log('Server started...');



io.sockets.on('connection', function (socket) {
    connections.push(socket);
    logging('Connected: '+connections.length+' socket connected');

    //Disconect
    socket.on('disconnect', function (data) {
        if(!socket.username) return;
        users.splice(users.indexOf(socket.username),1);
        updateUsernames();
        connections.splice(connections.indexOf(socket), 1);
        logging('Disconnected: '+connections.length+' socket connected');
    });

    socket.on('send message', function (data) {
        logging(socket.username+': ' +data);
        if(data == "/clear"){
            clear();
        }else{
            messages.push(data);
            io.sockets.emit('new message', {msg: messageIncaps(data), user: socket.username});
        }
    });
    socket.on('new user', function (data, callback) {
        callback(true);
        socket.username = data;
        logging('User: ' + socket.username + ' was connected!');
        users.push(socket.username);
        updateUsernames();

    });

    function clear() {
        io.sockets.emit('clear', users);
    }

    function updateUsernames() {
        io.sockets.emit('get user', users);
    }
});