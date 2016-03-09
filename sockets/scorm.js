var sockets = require('./sockets');

var scormSocket = {};

scormSocket.start = function(io) {

    io.of('/scorm').on('connection', function (socket) {

    });
};

module.exports = scormSocket;