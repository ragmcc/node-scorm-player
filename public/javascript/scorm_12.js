function ScormAPI() {
    var lastError = "0";

    function LMSInitialize(param) {
        return "true";
    }

    function LMSGetLastError() {
        return lastError;
    }

    function LMSGetValue(key) {
        var value = "";

        if( key == "cmi.core.lesson_status" ) {
            value = "not attempted";
        }

        return value;
    }

    function LMSSetValue(key, value) {
        return "true";
    }

    this.LMSInitialize = LMSInitialize;
    this.LMSGetLastError = LMSGetLastError;
    this.LMSGetValue = LMSGetValue;
    this.LMSSetValue = LMSSetValue;
}