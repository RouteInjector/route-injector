/**
 * Created by gerard on 1/21/16.
 */
///<reference path='../../../../typings/index.d.ts'/>
import httpServer = require('http');
import httpsServer = require('https');
import fs=require("fs");

class Server {

    public static createHttpServer(app:any) {
        return require('http').createServer(app);
    }

    public static createHttpsServer(keyFile:string, certFile:string, app:any) {
        var privateKey = fs.readFileSync(keyFile, 'utf8');
        var certificate = fs.readFileSync(certFile, 'utf8');
        var credentials = {key: privateKey, cert: certificate};
        return require('https').createServer(credentials, app);
    }
}
export = Server;