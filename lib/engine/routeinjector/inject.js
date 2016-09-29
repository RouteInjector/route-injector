var utils = require('./utils');
var model = require('./routes/model.js');
var configMethods = require('./routes/config.js');
var authMethods = require('./routes/auth.js');
var getByField = require('./rest/get').getByField;
var post = require('./rest/post').post;
var putByField = require('./rest/put').putByField;
var deleteByField = require('./rest/delete').deleteByField;
var getNDocuments = require('./rest/search').getNDocuments;
var getNDocumentsPost = require('./rest/search').getNDocumentsPost;
var exportDocuments = require('./rest/export').export;
var importDocuments = require('./rest/import').import;
var validateDocuments = require('./rest/validate.js').validate;
var _ = require('lodash');

var async = require('async');
var injector = require('../../');
var log = injector.log;

var checkRole = injector.security.checkRole;
var getUserIfExists = injector.security.getUserIfExists;
var urlTokenToHeader = injector.security.urlTokenToHeader;


module.exports = function (app) {
    var config = injector.config;
    var prefix = config.routes.prefix;
    var exprConfig = config.express || {};

    //SCHEMA
    app.get('/schemas', getUserIfExists.middleware, model.getModels);
    app.get('/schema/:modelname', getUserIfExists.middleware, model.getJsonSchema);
    app.post('/schema/:modelname', getUserIfExists.middleware, model.postJsonSchema);
    app.get('/schema/:modelname/formconfig', getUserIfExists.middleware, model.getFormConfig);
    app.get('/configs', getUserIfExists.middleware, configMethods.getConfigs);
    //app.get('/config/:config', getUserIfExists.middleware, configMethods.getConfig);

    var auth = config.env.auth || false;

    if (auth) {
        //TODO: Disable these routes, for example, when oauth plugin is loaded
        app.get('/auth/login/:login/:hash', authMethods.getLogin);
        app.post('/auth/login', authMethods.login);
        app.get('/auth/logout', authMethods.logout);
        app.get('/auth/checkToken/:token', authMethods.checkToken);

        //SECURITY
        //TODO: Modify 'admin' to config.security.adminRole

        if (config.permissions.adminRole) {
            app.get('/permissions/trace', getUserIfExists.middleware, checkRole(config.permissions.adminRole).middleware, function (req, res) {
                res.json(injector.cache.middlewares);
                return res.end();
            });

            app.get('/permissions/roles', getUserIfExists.middleware, checkRole(config.permissions.adminRole).middleware, function (req, res) {
                res.json(injector.security.permissions);
                return res.end();
            });

            app.get('/permissions/routes', getUserIfExists.middleware, checkRole(config.permissions.adminRole).middleware, function (req, res) {
                res.json(injector.security.permissionsByRole);
                return res.end();
            });

            app.get('/permissions/security', getUserIfExists.middleware, checkRole(config.permissions.adminRole).middleware, function (req, res) {
                res.json(injector.security);
                return res.end();
            });
        }
    }

    return function (Model) {
        var modelConf = utils.checkSetup(Model);
        var middleware = utils.checkMiddleware(modelConf);
        utils.configureForm(Model);
        var path = modelConf.path;
        var identifier = modelConf.id;

        function processMiddleware(middleware, list) {
            if (list) {
                return middleware.name;
            } else {
                if (middleware instanceof Function) {
                    injector.log.warn("Middleware " + middleware.name + " should be defined as an object with properties 'name' and 'middleware");
                    return middleware;
                } else if (middleware.name) {
                    return middleware.middleware;
                } else {
                    return null;
                }
            }
        }

        function appendMiddlewares(appendTo, middlewares, list) {
            if (!middlewares) return;

            if (middlewares instanceof Array) {

                //TODO: �apa, make promise
                for (var item in middlewares) {
                    var m = processMiddleware(middlewares[item], list);

                    if (m) {
                        appendTo.push(m);
                    } else {
                        log.warn("Invalid middleware", middlewares[item]);
                    }
                }
            } else {
                var m = processMiddleware(middlewares, list);
                if (m) {
                    appendTo.push(m);
                }
            }
        }

        function routeMiddlewares(verb, list) {

            var functions = [];

            appendMiddlewares(functions, getUserIfExists, list);
            appendMiddlewares(functions, middleware[verb], list);

            if (exprConfig.globalMiddlewares) {
                appendMiddlewares(functions, exprConfig.globalMiddlewares[verb], list);
            }
            if (exprConfig.modelMiddlewares && exprConfig.modelMiddlewares[Model.modelName]) {
                appendMiddlewares(functions, exprConfig.modelMiddlewares[Model.modelName]["all"], list);
                appendMiddlewares(functions, exprConfig.modelMiddlewares[Model.modelName][verb], list);
            }

            var sec = injector.security.permissions;
            if (auth && sec && sec.routes && sec.routes[Model.modelName] /*&& sec.routes[Model.modelName][verb].length != injector.security.roles.length*/) {
                if (sec.routes[Model.modelName][verb].length) // Avoid adding role if empty
                    appendMiddlewares(functions, checkRole(sec.routes[Model.modelName][verb]), list);
            }

            if (!list) {
                if (!injector.cache.middlewares)
                    injector.cache.middlewares = {};

                if (!injector.cache.middlewares[Model.modelName])
                    injector.cache.middlewares[Model.modelName] = {};

                injector.cache.middlewares[Model.modelName][verb] = routeMiddlewares(verb, true);
            }

            return functions;
        }

        //Inject routes
        if (modelConf.get.disable != true) {
            log.debug("Inject route: GET " + path + '/:' + identifier);
            var getMiddlewares = routeMiddlewares("get");
            app.get(prefix + '/' + path + '/:' + identifier, getMiddlewares, getByField(Model));
        }

        // TODO: If posting to /xxxx/ (note the final slash) it throws a TypeError: undefined is not a function
        if (modelConf.post.disable != true) {
            log.debug("Inject route: POST " + path);
            var postMiddlewares = routeMiddlewares("post");
            app.post(prefix + '/' + path, postMiddlewares, post(Model));
        }

        if (modelConf.put.disable != true) {
            log.debug("Inject route: PUT " + path + '/:' + identifier);
            var putMiddlewares = routeMiddlewares("put");
            app.put(prefix + '/' + path + '/:' + identifier, putMiddlewares, putByField(Model));
        }

        if (modelConf.delete.disable != true) {
            log.debug("Inject route: DELETE " + path + '/:' + identifier);
            var deleteMiddlewares = routeMiddlewares("delete");
            app.delete(prefix + '/' + path + '/:' + identifier, deleteMiddlewares, deleteByField(Model, identifier));
        }

        if (modelConf.search.disable != true) {
            var plural = modelConf.plural || path + 's';
            log.debug("Inject route: GET/POST " + plural);
            var searchMiddlewares = routeMiddlewares("search");
            app.get(prefix + '/' + plural, searchMiddlewares, getNDocuments(Model));
            app.post(prefix + '/' + plural, searchMiddlewares, getNDocumentsPost(Model));
        }

        if (modelConf.export.disable != true) {
            var plural = modelConf.plural || path + 's';
            log.debug("Inject route: export " + plural + '/export');
            var exportMiddlewares = routeMiddlewares("export");
            app.post(prefix + '/' + plural + '/export', urlTokenToHeader.middleware, exportMiddlewares, exportDocuments(Model));
        }

        if (modelConf.import.disable != true) {
            var plural = modelConf.plural || path + 's';
            log.debug("Inject route: import " + plural + '/import');
            var importMiddleware = routeMiddlewares("import");
            app.post(prefix + '/' + plural + '/import', importMiddleware, importDocuments(Model));
        }

        if(modelConf.validate.disable != true) {
            var plural = modelConf.plural || path + 's';
            log.debug("Inject route: validate " + plural + '/import');
            //var importMiddleware = routeMiddlewares("validate");
            //app.get(prefix + '/' + plural + '/validate', importMiddleware, validateDocuments(Model));
            app.get(prefix + '/' + plural + '/validate', validateDocuments(Model));
        }

        /**
         * This module injects the backoffice functions in the API
         * FOR DEPENDS ON
         */
        if (modelConf.backoffice) {
            var backoffice = modelConf.backoffice;
            Object.keys(backoffice).forEach(function (key) {
                log.debug("Inject route: backoffice " + path + '/' + key);
                app.post(prefix + '/_' + path + '/' + key, function (req, res) {
                    var parameters = [];
                    parameters.push(req.body);
                    parameters.push(function (data) {
                        return res.json(data);
                    });
                    return backoffice[key].apply(this, parameters);
                });
            });
        }

        utils.addModel(Model);

    };
};
