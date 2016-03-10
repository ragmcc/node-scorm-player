function ScormAPI() {
    var lastError = "0";
    var log = new Log();

    function LMSInitialize(param) {
        var success = "true";

        log.i('LMSInitialize(' + param + '){ return "' + success + '" }');

        return success;
    }

    function LMSGetLastError() {

        log.i('LMSGetLastError(){ return "' + lastError + '" }');

        return lastError;
    }

    function LMSGetValue(key) {
        var value = "";

        if( key == "cmi.core.lesson_status" ) {
            value = "not attempted";
        }

        log.i('LMSGetValue(' + key + '){ return "' + value + '" }');

        return value;
    }

    function LMSSetValue(key, value) {
        var success = "true";

        log.i('LMSSetValue(' + key + ', ' + value + '){ return "' + success + '" }');

        return success;
    }

    function LMSCommit(param) {
        var success = "true";

        log.i('LMSCommit(' + param + '){ return "' + success + '" }');

        return success;
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
        this.e = e;
    }

    this.LMSInitialize = LMSInitialize;
    this.LMSGetLastError = LMSGetLastError;
    this.LMSGetValue = LMSGetValue;
    this.LMSSetValue = LMSSetValue;
    this.log = log;
}