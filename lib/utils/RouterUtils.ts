/**
 * Created by gerard on 19/04/16.
 */
/// <reference path='../../typings/index.d.ts'/>
let injector = require("../");
let app = injector.app;
class RouterUtils {


    public static handleInternalRewrite(req, res) {
        app.handle(req, res);
    }

}
export = RouterUtils;