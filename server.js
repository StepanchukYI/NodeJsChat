var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');

users = [];
connections = [];
messages = [];

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});


function logging(data) {
    fs.appendFile("tmp/test.log", data + '\n', function(err) {
        if(err) {
            return console.log(err);
        }
    });
}

function messageIncaps(message) {
	message.trim();

    'use strict';
	message.replace(/[\s{2,}]+/g, ' ');
    return message.replace(/[\"&'\/<>]/g, function (a) {
        return {
            '"': '&quot;', '&': '&amp;', "'": '&#39;',
            '/': '&#47;',  '<': '&lt;',  '>': '&gt;',
			'\n': '<br>',  '\r':'<br>', '\r\n': '<br>', 
        }[a];
    });
}

function getDate() {
    var currentdate = new Date();
    var date = currentdate.getDate() + "/"
        + (currentdate.getMonth()+1)  + "/"
        + currentdate.getFullYear();
    var time = currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();

    return {date: date, time: time};
}

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
        logging(socket.username+': ' + data);
        if(data == "/clear"){
            clear();
        }else{
			if(data){
				data = messageIncaps(data);
				var time = getDate();
				messages.push({user: socket.username, text: data, time: time});
				console.log(messages);
				io.sockets.emit('new message', {msg: data, user: socket.username, msgTime: time.time});
			}
        }
    });
    socket.on('new user', function (data, callback) {
		if(data){
			socket.username = messageIncaps(data);
			callback( {myName: socket.username, msg: messages});
			logging('User: ' + socket.username + ' was connected!');
			users.push(socket.username);
			updateUsernames();
		}
    });

    function clear() {
        io.sockets.emit('clear', users);
    }

    function updateUsernames() {
        io.sockets.emit('get user', users);
    }
});