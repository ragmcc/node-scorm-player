var sockets = {};

sockets.load = function (io) {
    sockets.io = io;
    sockets.clients = 0;

    var room = require('./scorm').start(io);
};

module.exports = sockets;