'use strict';
var path = require('path');
var Swagger = require('ri-swagger');
var Backoffice = require('./backoffice');
var RouteInjector = require('./routeinjector');

var injector = undefined;
var app = undefined;
var express = undefined;

module.exports = function (_injector) {
    injector = _injector || this;
    app = injector.app;
    express = injector.internals.express;

    if (injector.config.env.images.path) {
        exportImageServer();
    }

    if (injector.config.env.files) {
        exportFileServer();
    }

    var routeInjector = new RouteInjector(injector);
    routeInjector.inject();

    var swagger = new Swagger(injector);
    swagger.inject();

    var backoffice = new Backoffice(injector);
    backoffice.inject();
};

function exportImageServer() {
    var IMGR = require('imgr').IMGR;
    var imgr = new IMGR(injector.config.env.images.imgrConfig || {});
    imgr.serve(injector.config.env.images.path) //folder
        .namespace('/images')// /image
        .cacheDir(injector.config.env.images.cache)
        .urlRewrite('/:path/:size/:file.:ext') // '/:path/:size/:file.:ext'
        .using(app);
}

function exportFileServer() {
    app.use('/files', express.static(injector.config.env.files.path));
}