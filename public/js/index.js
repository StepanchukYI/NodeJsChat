$(function () {
    var socket = io.connect();
    var $messageForm = $('#messageForm');
    var $message = $('#message');
    var $chat = $('#chat');
    var $messageArea = $('#messageArea');
    var $userFormArea = $('#userFormArea');
    var $userForm = $('#userForm');
    var $users = $('#users');
    var $username = $('#username');
    var $userNameArea = $('#userNameArea');

    $messageForm.submit(function (e) {
        e.preventDefault();
        socket.emit('send message', $message.val());
        $message.val('');
    });

    socket.on('new message', function (data) {
        $chat.append('<div class="well"><strong>' + data.user + ': </strong>' + data.msg + '</div>'); //</div><div style="right:10%;position: absolute;">'+data.msgTime +'</div>
        $chat.animate({scrollTop: $chat[0].scrollHeight}, 500);
    });

    $userForm.submit(function (e) {
        e.preventDefault();
        socket.emit('new user', $username.val(), function (data) {
            if (data) {
                $userFormArea.hide();
                $messageArea.show();
                console.log(data.myName);
                $userNameArea.html(data.myName);
                for (i = 0; i < data.msg.length; i++) {
                    $chat.append('<div class="well"><strong>' + data.msg[i].user + ': </strong>' + data.msg[i].text + '</div>');
                }
            }
        });
        $username.val('');
    });

    socket.on('clear', function (data) {
        var html = '';
        $chat.html(html);
    });

    $messageArea.keydown(function (e) {

        if (e.ctrlKey && e.keyCode == 13) {
            e.preventDefault();
            socket.emit('send message', $message.val());
            $message.val('');
        }
    });

    socket.on('get user', function (data) {
        var html = '';
        for (i = 0; i < data.length; i++) {
            console.log(data[i]);
            html += '<li class="list-group-item">' + data[i] + '</li>';
        }
        $users.html(html);
    });

});