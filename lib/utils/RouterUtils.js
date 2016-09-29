"use strict";
/**
 * Created by gerard on 19/04/16.
 */
/// <reference path='../typings/index.d.ts'/>
var injector = require('../');
var app = injector.app;
var RouterUtils = (function () {
    function RouterUtils() {
    }
    RouterUtils.handleInternalRewrite = function (req, res) {
        app.handle(req, res);
    };
    return RouterUtils;
}());
module.exports = RouterUtils;
//# sourceMappingURL=RouterUtils.js.map