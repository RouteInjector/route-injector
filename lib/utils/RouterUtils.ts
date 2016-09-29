/**
 * Created by gerard on 19/04/16.
 */
/// <reference path='../typings/index.d.ts'/>
var injector = require('../');
var app = injector.app;
class RouterUtils {


    public static handleInternalRewrite(req, res) {
        app.handle(req, res);
    }

}
export = RouterUtils;