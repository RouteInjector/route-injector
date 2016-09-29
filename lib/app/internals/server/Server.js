"use strict";
var fs = require("fs");
var Server = (function () {
    function Server() {
    }
    Server.createHttpServer = function (app) {
        return require('http').createServer(app);
    };
    Server.createHttpsServer = function (keyFile, certFile, app) {
        var privateKey = fs.readFileSync(keyFile, 'utf8');
        var certificate = fs.readFileSync(certFile, 'utf8');
        var credentials = { key: privateKey, cert: certificate };
        return require('https').createServer(credentials, app);
    };
    return Server;
}());
module.exports = Server;
//# sourceMappingURL=Server.js.map