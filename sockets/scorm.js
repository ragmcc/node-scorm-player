/*eslint-env node*/
var sockets = require('./sockets');
var uuid = require('node-uuid');

var scormSocket = {};

var scormModel = require('../models/scorm');

var user_id = 1;

scormSocket.start = function(io) {
    io.of('/scorm').on('connection', function (socket) {
        socket.emit('connected');
        console.log("Server connected")
        socket.on('initialize', function(sco) {
            console.log('Initialize sco: ' + sco);
            scormModel.getOne({
                'query': {
                    'sco': sco.toString(),
                    'data.cmiUFF0EcoreUFF0Estudent_id': user_id
                },
                'scope': [],
                'success': function(result) {
                    var data = {};
                    if( result !== null && result.data !== null && result.data !== undefined ) {
                        data = result.data;
                    } else {
                        data = {
                            'cmi.core.lesson_status': 'not attempted',
                            'cmi.core.student_id': user_id
                        }
                    }

                    var dataTmp = {};
                    for( var i in data ) {
                        data[i] = {
                            'value': data[i],
                            'status': 0
                        };

                        dataTmp[i.toString().replace(/UFF0E/g, '.')] = data[i];
                    }

                    data = dataTmp;

                    var session = uuid.v4();

                    if( data['cmi.core.lesson_status'].value == 'not attempted' ) {
                        var sessions = {};
                        sessions[session] = {
                            'insert_at': (new Date())
                        };

                        scormModel.insert({
                            'data': {
                                'sco': sco,
                                'data': {
                                    'cmiUFF0EcoreUFF0Elesson_status': 'not attempted',
                                    'cmiUFF0EcoreUFF0Estudent_id': user_id
                                },
                                'sessions': sessions
                            },
                            'success': function(id) {
                                socket.emit('initialized', {
                                    success: true,
                                    data: data,
                                    session: session
                                });
                            },
                            'error': function(error) {
                                socket.emit('initialized', {
                                    success: false,
                                    'error': error
                                });
                            }
                        });
                    } else {
                        data = {};
                        data['sessions.' + session] = {
                            'insert_at': (new Date())
                        };

                        scormModel.update({
                            'query': {
                                'sco': sco,
                                'data.cmiUFF0EcoreUFF0Estudent_id': user_id
                            },
                            'set': data,
                            'upsert': true,
                            'success': function() {
                                socket.emit('initialized', {
                                    success: true,
                                    data: data,
                                    session: session
                                });
                            },
                            'error': function() {
                                socket.emit('commited',{
                                    success: false,
                                    error: error
                                });
                            }
                        });
                    }
                },
                'error': function(error) {
                    socket.emit('initialized', {
                        success: false,
                        'error': error
                    });
                }
            });
        });

        socket.on('commit', function(params) {
            console.log("server commit: ")
            var sco = params.sco;
            var session = params.session;
            var data = params.data;

            if( Object.keys(data).length > 0 ) {
                var dataTmp = {};
                for (var i in data) {
                    dataTmp['data.' + i.toString().replace(/\./g, 'UFF0E')] = data[i].value;
                }
                data = dataTmp;

                if( data['data.cmiUFF0EcoreUFF0Esession_time'] !== null && data['data.cmiUFF0EcoreUFF0Esession_time'] !== undefined ) {
                    data['sessions.' + session + '.time'] = data['data.cmiUFF0EcoreUFF0Esession_time'];
                    delete data['data.cmiUFF0EcoreUFF0Esession_time'];
                }

                scormModel.update({
                    'query': {
                        'sco': sco,
                        'data.cmiUFF0EcoreUFF0Estudent_id': user_id
                    },
                    'set': data,
                    'upsert': false,
                    'success': function() {
                        socket.emit('commited',{
                            success: true
                        });
                    },
                    'error': function() {
                        socket.emit('commited',{
                            success: false,
                            error: error
                        });
                    }
                });
            } else {
                socket.emit('commited',{
                    'success': true
                });
            }
        });
    });
};

module.exports = scormSocket;