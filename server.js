var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var fs = require('fs');
const request = require('request');

user_names = [];
real_users = [];

messages = [];

app.use(express.static(__dirname + '/public'));


app.get('/', function (req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

function messageIncaps(message) {
    message.trim();

    'use strict';
    message.replace(/[\s{2,}]+/g, ' ');
    return message.replace(/[\"&'\/<>]/g, function (a) {
        return {
            '"': '&quot;', '&': '&amp;', "'": '&#39;',
            '/': '&#47;', '<': '&lt;', '>': '&gt;',
            '\n': '<br>', '\r': '<br>', '\r\n': '<br>',
        }[a];
    });
}

function getDate() {
    var currentdate = new Date();
    var date = currentdate.getDate() + "/"
        + (currentdate.getMonth() + 1) + "/"
        + currentdate.getFullYear();
    var time = currentdate.getHours() + ":"
        + currentdate.getMinutes() + ":"
        + currentdate.getSeconds();

    return {date: date, time: time};
}

server.listen(process.env.PORT || 3000);
console.log('Server started...');

io.sockets.on('connection', function (socket) {

    //Disconect
    socket.on('disconnect', function (data) {
        if (!socket.username) return;
        flag = false;
        id = 0;
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
            real_users.splice(real_users.indexOf(real_users[id]), 1);

            user_names.splice(user_names.indexOf(socket.username), 1);

            updateUsernames();
        }
    });

    socket.on('send message', function (data) {
        if (data == "/clear") {
            clear();
        } else {
            if (data) {
                var time = getDate();
                messages.push({user: socket.userid, text: data, time: time});
                io.sockets.emit('new message', {msg: data, user: socket.username, msgTime: time.time});
                // if (messages.length % 3 >= 1) {
                //     console.log('12312');
                //     axios.get('http://37.57.92.40/send', {msg: messages})
                //         .then(function (value) {
                //             for (i = 0; i < messages.length; i++) {
                //                 messages.splice(messages.indexOf(messages[i]), 1);
                //             }
                //             for (j = 0; j < real_users.length; j++) {
                //                 real_users[i].last_message = value.data.id;
                //             }
                //         });
                //     console.log(messages);
                //     console.log(real_users);
                // }
            }
        }
    });

    socket.on('new user', function (data, callback) {
        if (data) {
            var user = [];
            console.log(data);
            // request.post('http://37.57.92.40/user', {id: data.id})
            //     .on('response', function (response,body) {
            //         console.log(response.toJSON());
            //         console.log(body);
            //         flag = false;
            //         user = response.data;
            //         socket.username = user.name;
            //         socket.userid = user.id;
            //         for (i = 0; i < real_users.length; i++) {
            //             if (user.id == real_users[i].id) {
            //                 flag = true;
            //                 real_users[i].sockets.push(socket);
            //             }
            //         }
            //         if (!flag) {
            //             user.sockets = [];
            //             user.sockets.push(socket);
            //             real_users.push(user);
            //             user_names.push(socket.username);
            //         }
            //
            //         callback({myName: socket.username, msg: messages});
            //         updateUsernames();
            //     });
            request({
                method: 'POST',
                uri: 'http://37.57.92.40/user',
                multipart: [
                    {
                        'content-type': 'application/json',
                        body: JSON.stringify({id: data})
                    }
                ]
            }, function (err, res, body) {
                console.log('REQUEST RESULTS:', res.statusCode, body);
            });
            //     .on('response', function (response) {
            //     console.log(response);
            // });
        }
    });

    function clear() {
        io.sockets.emit('clear', user_names);
    }

    function updateUsernames() {
        io.sockets.emit('get user', user_names);
    }
});