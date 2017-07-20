'use strict';
var path = require('path');
var Swagger = require('ri-swagger');
var Backoffice = require('./backoffice');
var RouteInjector = require('./routeinjector');

var injector = undefined;
var app = undefined;
var express = undefined;
var log = undefined;

module.exports = function (_injector) {
    injector = _injector || this;
    app = injector.app;
    express = injector.internals.express;
    log = injector.log;

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

var child = require('child_process');
var format = require('util').format;

function optimiseImage(image, callback) {
    log.debug("OPTIMIZING ", image);
    if (/\.png$/i.test(image)) {
        log.debug("PNG ",image);
        image = image.replace("$","\\$");
        var p = child.exec(format('optipng "%s"', image), callback);

        p.stdout.on('data', function(data) {
            log.debug(data);
        });

        p.stderr.on('data', function(data) {
            log.debug(data);
        });
    } else if (/\.jpe?g$/i.test(image)) {
        image = image.replace("$","\\$");
        log.debug("JPEG ",image);
        var p = child.exec(format('jpegoptim -m90 -o "%s"', image), callback);

        p.stdout.on('data', function(data) {
            log.debug(data);
        });

        p.stderr.on('data', function(data) {
            log.debug(data);
        });
    } else {
        callback();
    }
}

function exportImageServer() {
    var IMGR = require('imgr').IMGR;
    var config = injector.config.env.images.imgrConfig || {};
    if(config.optimisation == undefined) {
        config.optimisation = optimiseImage;
    }
    var imgr = new IMGR(config);
    imgr.serve(injector.config.env.images.path) //folder
        .namespace('/images')// /image
        .cacheDir(injector.config.env.images.cache)
        .urlRewrite('/:path/:size/:file.:ext') // '/:path/:size/:file.:ext'
        .using(app);
}

function exportFileServer() {
    app.use('/files', express.static(injector.config.env.files.path));
}
