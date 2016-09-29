/**
 * Created by Gerard on 01/10/2014.
 */
'use strict';
//Imports
var async = require('async');
var swagger = require('swagger-node-express');
var path = require('path');
var SwaggerUtils = require('./swaggerUtils');
var fs = require('fs');

// private properties
var injector = undefined;
var app = undefined;
var config = undefined;
var models = undefined;
var pathMap = undefined;
var log = undefined;
var express = undefined;

module.exports = SwaggerInjector;

function SwaggerInjector(_injector) {
    injector = _injector;
    app = _injector.app;
    config = _injector.config.swagger;
    models = _injector.models;
    log = _injector.log;
    express = _injector.internals.express;
}

SwaggerInjector.prototype.inject = function () {
    // Start binding swagger to router
    setAppHandler();
    setUIHandler();
    // Bind models to swagger
    addModels();
    // Cache paths (singular and plural for each model)
    cacheModelsPaths();
    // Parse routes
    parseRoutes();
    // Commit all changes
    commit();
}

function setAppHandler() {
    swagger.setAppHandler(app);
}

function setUIHandler() {
    app.use('/swagger', express.static(path.join(__dirname, 'public', 'swagger')));
    var swaggerPath = path.join(path.dirname(require.resolve('swagger-ui/package.json')),'dist');
    app.use(config.ui_path || '/swagger', express.static(swaggerPath));
}

function addModels() {
    var m = {models: {}};
    async.forEach(Object.keys(models), function (key) {
        var Model = models[key];
        m.models[Model.modelName] = SwaggerUtils.generateModelDefinition(Model);
    });
    swagger.addModels(m);
}

function cacheModelsPaths() {
    pathMap = {};
    async.forEach(Object.keys(models), function (key) {
        var Model = models[key];
        var path = Model.injector().path;
        var plural = Model.injector().plural || path + 's';
        pathMap[path] = {model: Model, config: Model.injector()};
        pathMap[plural] = {model: Model, config: Model.injector()};
    });
}

function parseRoutes() {
    var routes;
    try {
        routes = app._router.stack;
    } catch (e) {
        throw "Express 3 is not supported";
    }

    async.forEach(routes, function (route) {
        var innerRoute = route.route;
        if (innerRoute) {
            innerRoute.keys = route.keys;
            if (innerRoute['path'] == '/models')
                throw new Error("path /models not supported");

            if ((innerRoute['path'] != '*') && (innerRoute['path'] != 'development')) {
                log.debug("Adding spec: " + innerRoute['path']);
                var path = SwaggerUtils.getPath(innerRoute['path']);
                if (innerRoute.methods.get)
                    addSpec("get", innerRoute, path);
                if (innerRoute.methods.post)
                    addSpec("post", innerRoute, path);
                if (innerRoute.methods.put)
                    addSpec("put", innerRoute, path);
                if (innerRoute.methods.delete)
                    addSpec("delete", innerRoute, path);
            }
        }
    });
    log.debug("Ending inject");
}

function addSpec(method, route, path) {
    var Model = (!pathMap[path]) ? {modelName: path} : pathMap[path].model;

    var params = [];

    switch (method) {
        case 'get':
            if (route['keys']) {
                async.forEach(route['keys'], function (key) {
                    params.push(swagger.pathParam(key['name'], "ID of " + Model.modelName + " that needs to be fetched", "string"));
                    if (pathMap[path])
                        SwaggerUtils.completeParams(swagger, pathMap[path].config, pathMap[path].config[method], params);
                });
            }
            SwaggerUtils.addQueryParams(route, params);
            swagger.addGet(SwaggerUtils.specGenerator(Model, route, params));
            break;

        case 'post':
            if (route['keys']) {
                async.forEach(route['keys'], function (key) {
                    params.push(swagger.pathParam(key['name'], "ID of " + Model.modelName + " that needs to be inserted", "string"));
                });
                if (pathMap[path])
                    SwaggerUtils.completeParams(swagger, pathMap[path].config, pathMap[path].config[method], params);
            }

            if (Model.schema) {//is a valid registered mongoose schema model
                var splittedRoute = route.path.split('/');
                var lastValue;
                if (splittedRoute instanceof Array)
                    lastValue = splittedRoute[splittedRoute.length - 1];
                else
                    lastValue = spliitedRoute;

                var doc = new Model();
                var out = doc.jsonform();
                var f = out[lastValue];
                if (f && f.type == "object" && f.properties && f.properties.image && f.properties.image.format && f.properties.image.format == "image") {
                    params.push(swagger.bodyParam("image", "Image to be uploaded", "file"));
                } else {
                    if (f && f.type == "array" && f.items.type == "object" && f.items.properties && f.items.properties.image && f.items.properties.image.format && f.items.properties.image.format == "image") {
                        //Array of images
                        params.push(swagger.bodyParam("image", "Image to be uploaded", "file"));
                    }
                    params.push(swagger.bodyParam("body", "JSON fields of " + Model.modelName + " that needs to be inserted", Model.modelName));
                }
            } else {//is not targetting any registered model
                params.push(swagger.bodyParam("body", "JSON fields of " + Model.modelName + " that needs to be inserted", Model.modelName));
            }
            SwaggerUtils.addQueryParams(route, params);
            swagger.addPost(SwaggerUtils.specGenerator(Model, route, params));
            break;

        case 'delete':
            if (route['keys']) {
                async.forEach(route['keys'], function (key) {
                    params.push(swagger.pathParam(key['name'], "ID of " + Model.modelName + " that will be deleted", "string"));
                    if (pathMap[path])
                        SwaggerUtils.completeParams(swagger, pathMap[path].config, pathMap[path].config[method], params);
                });
            }
            SwaggerUtils.addQueryParams(route, params);
            swagger.addDelete(SwaggerUtils.specGenerator(Model, route, params));
            break;

        case 'put':
            if (route['keys']) {
                async.forEach(route['keys'], function (key) {
                    params.push(swagger.pathParam(key['name'], "ID of " + Model.modelName + " that needs to be modified", "string"));
                    if (pathMap[path])
                        SwaggerUtils.completeParams(swagger, pathMap[path].config, pathMap[path].config[method], params);
                });
            }
            params.push(swagger.bodyParam("body", "JSON fields of " + Model.modelName + " that needs to be modified", Model.modelName));
            SwaggerUtils.addQueryParams(route, params);
            swagger.addPut(SwaggerUtils.specGenerator(Model, route, params));
            break;
    }
}

function commit() {
    if (config) {
        swagger.configureSwaggerPaths("", config.doc_path, "");
        swagger.configure("/", config.version);
        swagger.setApiInfo(config.info);
    }
}
