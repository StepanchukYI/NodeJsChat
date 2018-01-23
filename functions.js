
function logging(data) {
    fs.appendFile("tmp/test.log", data + '\n', function(err) {
        if(err) {
            return console.log(err);
        }
    });
}

function messageIncaps(message) {
    'use strict';
    message.replace(/[\"&'\/<>]/g, function (a) {
        return {
            '"': '&quot;', '&': '&amp;', "'": '&#39;',
            '/': '&#47;',  '<': '&lt;',  '>': '&gt;'
        }[a];
    });
    return message.replace(/(\n|\r|\r\n)/g, '<br>');
}
