var express = require('express')
    , config = require('./config')
    , app = express()
    , routes = require('./routes')
    , server = require('http').createServer(app)
    , io = require('socket.io').listen(server)
    , request = require('request');
const serverURL = config.HOST_HTTP + config.HOST + ':' + config.HOST_PORT + '/api';

server.listen(config.PORT || 3000);
console.log('Server started...');


user_names = [];
real_users = [];
var last_msg_id = 0;
messages = [];

app.use(express.static(__dirname + '/public'));

app.get('/', routes.index);


io.sockets.on('connection', function (socket) {

    //Disconect
    socket.on('disconnect', function () {
        if (!socket.username) return;
        var flag = false;
        var id = 0;
        for (i = 0; i < real_users.length; i++) {
            if (real_users[i].sockets.length != 0) {
                for (j = 0; j < real_users[i].sockets.length; j++) {
                    if (socket == real_users[i].sockets[j]) {
                        real_users[i].sockets.splice(real_users[i].sockets.indexOf(socket), 1);
                        if (real_users[i].sockets.length == 0) {
                            flag = true;
                            id = i;
                        }
                    }
                }
            }
        }
        if (flag) {

            request.post(serverURL + '/user/logout', {
                    json: {
                        user_id: real_users[id].id,
                        last_message: real_users[id].last_message
                    }
                },
                function (error, response, body) {
                console.log(body);
                });

            real_users.splice(real_users.indexOf(real_users[id]), 1);

            user_names.splice(user_names.indexOf(socket.username), 1);

            updateUsers();
        }
    });

    socket.on('send message', function (data) {
        if (data == "/clear") {
            clear();
        } else {
            if (data) {
                var time = getDate();
                data = messageIncaps(data);
                messages.push({user: socket.userid, text: data, time: time});
                io.sockets.emit('new message', {msg: data, user: socket.username, msgTime: time.time});

                request.post(serverURL + '/send', {json: {msg: messages}},
                    function (error, response, body) {
                        for (var i = 0; i < messages.length; i++) {
                            messages.splice(messages.indexOf(messages[i]), 1);
                        }
                        for (var j = 0; j < real_users.length; j++) {
                            real_users[j].last_message = body.id;
                            last_msg_id = body.id;
                        }
                    });

            }
        }
    });

    socket.on('new user', function (data, callback) {
        if (data) {
            var user = [];
            request.post(serverURL + '/user/login', {json: {id: data}},
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        flag = false;
                        user = body.user;
                        socket.username = user.name;
                        socket.userid = user.id;
                        if(body.last_id > last_msg_id){
                            last_msg_id = body.last_id;
                        }
                        for (i = 0; i < real_users.length; i++) {
                            if (user.id == real_users[i].id) {
                                flag = true;
                                real_users[i].sockets.push(socket);
                            }
                        }
                        if (!flag) {
                            user.sockets = [];
                            user.sockets.push(socket);
                            real_users.push(user);
                            user_names.push(socket.username);
                        }

                        callback({myName: socket.user, msg: body.message, last_message: user.last_message});
                        updateUsers();
                    }
                });
        }
    });

});


function messageIncaps(message) {
    message.trim();

    'use strict';
    message.replace(/[\s{2,}]+/g, ' ');
    return message.replace(/[\"&'\/<>]/g, function (a) {
        return {
            '"': '&quot;', '&': '&amp;', "'": '&#39;',
            '/': '&#47;', '<': '&lt;', '>': '&gt;',
            '\n': '<br>', '\r': '<br>', '\r\n': '<br>'
        }[a];
    });
}

function getDate() {
    var currentdate = new Date();
    var date = currentdate.getFullYear() + ":"
        + (currentdate.getMonth() + 1) + ":"
        + currentdate.getDate();
    var time = currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();

    return {date: date, time: time};
}

function clear() {
    io.sockets.emit('clear', user_names);
}

function updateUsers() {
    io.sockets.emit('get user', user_names);
}