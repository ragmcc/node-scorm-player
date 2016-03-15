function ScormAPI(sco, callbacks) {
    var session = null;
    var lastError = "0";
    var log = new Log();
    var dataModel = {
        '': {
            'value': 'not attempted',
            'status': 0
        }
    };

    var socket = null;

    // Initialize

    if( callbacks.request == 'socket.io' ) {
        loadScript('/socket.io/socket.io.js', function() {
            socket = io.connect('/scorm');

            socket.on('connected', function () {
                console.log('Connected!');

                socket.emit('initialize', sco);
            });

            socket.on('initialized', function(response) {
                if (response.success == true) {
                    session = response.session;
                    dataModel = response.data;

                    if (isFunction(callbacks.success)) {
                        callbacks.success(true);
                    }
                } else {
                    if (isFunction(callbacks.success)) {
                        callbacks.success(false);
                    }
                }
            });

            socket.on('commited', function(response) {
                if( response.success == true ) {
                    commitSuccess(response);
                }
            });
        });
    } else if( callbacks.request == 'ajax' ) {
        ajax({
            'url': '/scorm/api/initialize/' + sco,
            'method': 'post',
            'type': 'json',
            'success': function (response) {
                if (response.success == true) {
                    session = response.session;
                    dataModel = response.data;

                    if (isFunction(callbacks.success)) {
                        callbacks.success(true);
                    }

                    commitSync();
                } else {
                    if (isFunction(callbacks.success)) {
                        callbacks.success(false);
                    }
                }
            },
            'error': function (error, xhrres, extra) {
                if (isFunction(callbacks.success)) {
                    callbacks.success(false);
                }
            }
        });
    }

    function LMSInitialize(param) {
        log.i('LMSInitialize(' + param + '){ return "true" }');
        return "true";
    }

    function LMSGetLastError() {
        log.i('LMSGetLastError(){ return "' + lastError + '" }');

        return lastError;
    }

    function LMSGetValue(key) {
        var value = "";

        if( key in dataModel ) {
            value = dataModel[key].value;
        }

        log.i('LMSGetValue(' + key + '){ return "' + value + '" }');

        return value;
    }

    function LMSSetValue(key, value) {
        var success = "true";

        log.i('LMSSetValue(' + key + ', ' + value + '){ return "' + success + '" }');

        dataModel[key] = {
            'value': value,
            'status': 0
        };

        if( callbacks.request == 'socket.io' ) {
            this.LMSCommit("");
        }

        return success;
    }

    var commitStack = [];
    var commiting = false;
    var commitAttempts = 0;
    var commitMaxAttempts = 5;
    function LMSCommit(param) {
        if( callbacks.request == 'socket.io' ) {
            var data = {};

            for( var i in dataModel ) {
                if( dataModel[i].status == 0 ) {
                    dataModel[i].status = 2;
                    data[i] = dataModel[i];
                }
            }

            socket.emit('commit', {
                sco: sco,
                session: session,
                data: data
            });
        } else if( callbacks.request == 'ajax' ) {
            commitStack.push(param);
        }

        log.i('LMSCommit(' + param + '){ return "true" }');

        return "true";
    }

    function commitSync() {
        if( commiting == false && commitStack.length > 0 ) {
            commiting = true;

            var data = {};

            for( var i in dataModel ) {
                if( dataModel[i].status == 0 ) {
                    dataModel[i].status = 2;
                    data[i] = dataModel[i];
                }
            }

            if( callbacks.request == 'ajax' ) {
                ajax({
                    'url': '/scorm/api/commit/' + sco,
                    'method': 'post',
                    'type': 'json',
                    'data': JSON.stringify({session: session, data: data}),
                    'success': function (response) {
                        commitSuccess(response);
                    },
                    'error': function (error, xhrres, extra) {
                        commitError();
                    }
                });
            }
        }

        setTimeout(commitSync, 500);
    }

    function commitSuccess(response) {
        var data = {};

        if (response.success == true) {
            for (var i in dataModel) {
                if (dataModel[i].status == 2) {
                    dataModel[i].status = 1;
                    data[i] = dataModel[i];
                }
            }
        } else {
            for (var i in dataModel) {
                if (dataModel[i].status == 2) {
                    dataModel[i].status = 0;
                    data[i] = dataModel[i];
                }
            }
        }

        commitStack.splice(0, 1);
        commiting = false;
        commitAttempts = 0;
    }

    function commitError() {
        for (var i in dataModel) {
            if (dataModel[i].status == 2) {
                dataModel[i].status = 0;
                data[i] = dataModel[i];
            }
        }

        commiting = false;

        if (commitAttempts > commitMaxAttempts) {
            commitAttempts = 0;
            commitStack.splice(0, 1);
        } else {
            commitAttempts++;
        }
    }

    function LMSFinish(param) {
        return "true";
    }

    // Window control

    // Common

    function ajax(request) {
        log.i("Preparing request...");

        // Prepare request
        if (request.url == undefined || request.url == null) {
            if (isFunction(request.error)) {
                log.e("URL is undefined!");
                request.error(101, 0);
            }
        }

        if (request.method == undefined || request.method == null) {
            if (isFunction(request.error)) {
                log.e("Method is undefined!");
                request.error(101, 0);
            }
        }

        if (request.type == undefined || request.type == null) {
            if (isFunction(request.error)) {
                log.e("Type is undefined!");
                request.error(101, 0);
            }
        }

        if (request.async == undefined || request.type == null) {
            request.async = true;
        }

        if( request.async != true && request.async != false ) {
            request.async = true;
        }

        if( request.async == false ) {
            // Perfor sync request
            log.i("Sending sync request...");

            return new Promise(function (resolve, reject) {
                var xhr = new XMLHttpRequest();

                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && xhr.status == 200) {
                        var response = xhr.responseText;

                        if (request.type.toLowerCase() == 'json') {
                            response = JSON.parse(response);

                            if (response.success != undefined && response.success != null) {
                                if (response.success == true) {
                                    log.s(JSON.stringify(response));
                                } else {
                                    log.e(JSON.stringify(response));
                                }
                            } else {
                                log.s(JSON.stringify(response));
                            }
                        } else {
                            log.s(response);
                        }

                        resolve(response);
                    } else if (xhr.readyState == 4) {
                        log.e("Code: " + 101);
                        log.e("XHR response: " + xhr.status);

                        resolve({'success': false});
                    }
                };

                xhr.error = reject;

                log.i('XHR open url "' + request.url + '" with method "' + request.method + '"');

                xhr.open(request.method, request.url, true);

                if (request.type.toLowerCase() == 'json') {
                    xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
                } else if(request.method.toLowerCase() == 'post') {
                    xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                }

                if (request.data != undefined && request.data != null) {
                    xhr.send(request.data);
                } else {
                    xhr.send();
                }
            });
        } else {
            // Perform async request
            log.i("Sending async request...");

            var xhr = new XMLHttpRequest();

            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4 && xhr.status == 200) {
                    var response = xhr.responseText;

                    if (request.type.toLowerCase() == 'json') {
                        response = JSON.parse(response);

                        if (response.success != undefined && response.success != null) {
                            if (response.success == true) {
                                log.s(JSON.stringify(response));
                            } else {
                                log.e(JSON.stringify(response));
                            }
                        } else {
                            log.s(JSON.stringify(response));
                        }
                    } else {
                        log.s(response);
                    }

                    if (isFunction(request.success)) {
                        request.success(response);
                    }
                } else if (xhr.readyState == 4) {
                    log.e("Code: " + 101);
                    log.e("XHR response: " + xhr.status);

                    if (isFunction(request.error)) {
                        request.error(101, xhr.status);
                    }
                }
            };

            log.i('XHR open url "' + request.url + '" with method "' + request.method + '"');

            xhr.open(request.method, request.url, true);

            if (request.type.toLowerCase() == 'json') {
                xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
            }

            if (request.data != undefined && request.data != null) {
                xhr.send(request.data);
            } else {
                xhr.send();
            }
        }
    }

    function isFunction(functionToCheck) {
        var getType = {};
        return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
    }

    function loadScript(url, callback) {
        // Adding the script tag to the head as suggested before
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;

        // Then bind the event to the callback function.
        // There are several events for cross browser compatibility.
        script.onreadystatechange = callback;
        script.onload = callback;

        // Fire the loading
        head.appendChild(script);
    }

    // Log
    function Log() {
        var enabled = false;

        function enable() {
            enabled = true;
        }

        function disable() {
            enabled = false;
        }

        function i(text) {
            if( enabled == true ) {
                console.log("%c SCORM API: info { " + text + " }", "background-color: rgba(67, 110 238, 0.2); color: #436EEE");
            }
        }

        function s(text) {
            if( enabled == true ) {
                console.log("%c SCORM API: success { " + text + " }", "background-color: rgba(168, 219, 168, 0.2); color: #79BD9A");
            }
        }

        function e(text) {
            if( enabled == true ) {
                console.log("%c SCORM API: error { " + text + " }", "background-color: rgba(255, 0, 51, 0.1); color: #ff0033");
            }
        }

        this.enable = enable;
        this.disable = disable;
        this.i = i;
        this.s = s;
        this.e = e;
    }

    this.LMSInitialize = LMSInitialize;
    this.LMSGetLastError = LMSGetLastError;
    this.LMSGetValue = LMSGetValue;
    this.LMSSetValue = LMSSetValue;
    this.LMSCommit = LMSCommit;
    this.LMSFinish = LMSFinish;
    this.log = log;
}