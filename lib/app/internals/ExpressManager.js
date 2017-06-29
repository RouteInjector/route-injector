"use strict";
///<reference path='../../../typings/index.d.ts'/>
var ConfigUtils = require("../../utils/ConfigUtils");
'use strict';
var express = require("express");
var session = require("express-session");
var Logger = require("./Logger");
var FSUtils = require("../../utils/FSUtils");
var Server = require("./server/Server");
var ExpressMiddlewares = require("./express/ExpressMiddlewares");
var RouteLoader = require("./RouteLoader");
var TranslationRepository = require("./TranslationRepository");
var MiddlewareRegistry = require("./MiddlewareRegistry");
var vhost = require("vhost"); //No tsd for vhost
var ExpressManager = (function () {
    function ExpressManager(config, pluginRegistry, pageLoader) {
        this.app = express();
        ExpressManager.logger.trace("Creating ExpressManager instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
        this.pageLoader = pageLoader;
        this.routeLoader = RouteLoader.create(this.config, this.pluginRegistry);
        this.translationRepository = TranslationRepository.create(this.config, this.pluginRegistry);
        this.middlewareRegistry = MiddlewareRegistry.create(this.config);
    }
    /**
     * Create an instance of ExpressManager using config and plugins
     * @param config
     * @param pluginRegistry
     * @returns {ExpressManager}
     */
    ExpressManager.create = function (config, pluginRegistry, pageLoader) {
        return new ExpressManager(config, pluginRegistry, pageLoader);
    };
    /**
     * Setup and build all Express routers and handlers
     * @param _injector
     */
    ExpressManager.prototype.buildServer = function (_injector) {
        this.expressSetup();
        this.sessionSetup();
        this.setVersion(_injector.version);
        this.exportMiddlewares();
        this.enableCorsIfConfigured();
        this.exportRoutes();
        this.exportPages();
        this.preInjectPlugins();
        //TODO: Next refactor :)
        require('../../engine')(_injector);
        ExpressManager.logger.info("");
        this.postInjectPlugins();
        this.exportTranslations();
        this.exportStatics();
        this.exportPublic();
        this.errorHandlers();
    };
    /**
     * Setup express configurations
     */
    ExpressManager.prototype.expressSetup = function () {
        ExpressMiddlewares.expressSetup(this.app, this.config);
    };
    /**
     * Setup express session if enabled
     */
    ExpressManager.prototype.sessionSetup = function () {
        if (this.config.session.enabled) {
            this.app.use(session(this.config.session));
        }
    };
    /**
     * Set route injector's version
     * @param version
     */
    ExpressManager.prototype.setVersion = function (version) {
        this.app.use(function (req, res, next) {
            res.header('X-Powered-By', 'RouteInjector ' + version);
            return next();
        });
    };
    /**
     * Enable CORS if developer has enabled on config > application > enableCors
     */
    ExpressManager.prototype.enableCorsIfConfigured = function () {
        if (this.config.application.enableCors) {
            this.app.all('*', ExpressMiddlewares.cors());
        }
    };
    /**
     * Export Middlewares
     */
    ExpressManager.prototype.exportMiddlewares = function () {
        var _this = this;
        ExpressManager.logger.debug("Exporting middlewares");
        this.middlewareRegistry.forEachMiddleware(function (middleware) {
            middleware(_this.app);
        });
        ExpressManager.logger.debug("");
    };
    /**
     * Export Routes
     */
    ExpressManager.prototype.exportRoutes = function () {
        var _this = this;
        ExpressManager.logger.debug("Exporting routes");
        this.routeLoader.forEachRouteFile(function (route) {
            route(_this.app);
        });
        ExpressManager.logger.debug("");
    };
    ExpressManager.prototype.exportPages = function () {
        var _this = this;
        ExpressManager.logger.debug("Exporting pages");
        this.pageLoader.exportNonBackofficePages(function (page, dir) {
            var staticPage = express.static(FSUtils.join(page.path, 'public'));
            if (page.cname) {
                ExpressManager.logger.debug("\t vhosted -> %s maps to %s", page.cname, FSUtils.join(page.path, 'public'));
                _this.app.use(vhost(page.cname, staticPage));
            }
            else {
                ExpressManager.logger.debug("\t /%s maps to %s", dir, FSUtils.join(page.path, 'public'));
                _this.app.use('/' + dir, staticPage);
            }
        });
        ExpressManager.logger.debug("");
    };
    /**
     * Export Translations
     */
    ExpressManager.prototype.exportTranslations = function () {
        var _this = this;
        ExpressManager.logger.debug("Exporting translations");
        var dirs = this.translationRepository.getTranslationDirectories();
        dirs.forEach(function (dir) {
            ExpressManager.logger.debug("\t Exporting %s", dir);
            _this.app.use("/admin/i18n", _this.express.static(dir));
        });
        ExpressManager.logger.info("");
    };
    /**
     * Export Statics
     */
    ExpressManager.prototype.exportStatics = function () {
        this.exportApplicationStatics();
        this.exportPluginsStatics();
    };
    /**
     * Export Public
     */
    ExpressManager.prototype.exportPublic = function () {
        this.app.use("/", this.express.static(FSUtils.join(__dirname, '..', '..', 'public')));
    };
    /**
     * Export Plugin Statics
     */
    ExpressManager.prototype.exportPluginsStatics = function () {
        var _this = this;
        ExpressManager.logger.info("Exporting Plugin Statics");
        this.pluginRegistry.getUrlAndDirForEachStatics(function (pluginName, url, dir, options) {
            _this.exportStatic(url, dir, options);
            ExpressManager.logger.debug("\t %s maps to directory %s", url, dir);
        });
        ExpressManager.logger.debug("");
    };
    /**
     * Call PreInject functions for each plugin
     */
    ExpressManager.prototype.preInjectPlugins = function () {
        var _this = this;
        ExpressManager.logger.info("Calling PreInjecting functions for Plugins");
        this.pluginRegistry.forEachPlugin(function (metaPlugin) {
            var plugin = metaPlugin.plugin;
            ExpressManager.logger.info("\t Calling PreInject on %s", plugin.name);
            if (plugin.preInject)
                plugin.preInject(_this.app);
        });
        ExpressManager.logger.info("");
    };
    /**
     * Call PostInject functions for each plugin
     */
    ExpressManager.prototype.postInjectPlugins = function () {
        var _this = this;
        ExpressManager.logger.info("Calling PostInject functions for Plugins");
        this.pluginRegistry.forEachPlugin(function (metaPlugin) {
            var plugin = metaPlugin.plugin;
            ExpressManager.logger.info("\t Calling PostInject on %s", plugin.name);
            if (plugin.postInject)
                plugin.postInject(_this.app);
        });
        ExpressManager.logger.info("");
    };
    /**
     * Export Application Statics
     */
    ExpressManager.prototype.exportApplicationStatics = function () {
        var _this = this;
        ExpressManager.logger.info("Exporting Application Statics");
        ConfigUtils.create(this.config).getApplicationStatics(function (url, path, options) {
            _this.exportStatic(url, path, options);
            ExpressManager.logger.debug("\t %s maps to directory /%s", url, FSUtils.relative(_this.config.appPath, path));
        });
        ExpressManager.logger.info("");
    };
    /**
     * Export Not Found and General Error Handler for Express
     */
    ExpressManager.prototype.errorHandlers = function () {
        if (this.config.application.notFound == undefined) {
            this.app.use(ExpressMiddlewares.notFoundHandler());
        }
        else {
            if (this.config.application.notFound == "disabled") {
                // do nothing, so 404 can be intercepted in bin/www
            }
            else if (this.config.application.notFound == "angular") {
                // return index.html without redirect
                var path = FSUtils.join(this.config.appPath, this.config.application.indexPath);
                this.app.use(ExpressMiddlewares.angularNotFoundHandler(path));
            }
            else {
                // make a redirect to the URL specified.
                this.app.use(ExpressMiddlewares.redirectHandler("http://www.ondho.com"));
            }
        }
        this.app.use(ExpressMiddlewares.errorHandler());
    };
    /**
     * Bind server and callback to alert that the binding is already done
     * @param callback
     */
    ExpressManager.prototype.bind = function (callback) {
        var server;
        if (this.config.env.ssl && this.config.env.ssl.enabled) {
            ExpressManager.logger.info('HTTPS is enabled');
            var keyFile = this.config.env.ssl.key;
            var certFile = this.config.env.ssl.cert;
            server = Server.createHttpsServer(keyFile, certFile, this.app);
        }
        else {
            server = Server.createHttpServer(this.app);
        }
        this.pluginRegistry.forEachPlugin(function (metaPlugin) {
            if (metaPlugin.plugin.attachServer) {
                metaPlugin.plugin.attachServer(server);
            }
        });
        server.listen(this.config.env.bind.port, function () {
            ExpressManager.logger.info('');
            ExpressManager.logger.info('Server listening on port ' + server.address().port);
            ExpressManager.logger.info('Backoffice is located on /admin');
            callback();
        });
    };
    Object.defineProperty(ExpressManager.prototype, "express", {
        get: function () {
            return express;
        },
        enumerable: true,
        configurable: true
    });
    ExpressManager.prototype.exportStatic = function (url, path, options) {
        if (!options) {
            options = { maxage: '1d' };
        }
        this.app.use(url, express.static(path, options));
    };
    ExpressManager.logger = Logger.getLogger();
    return ExpressManager;
}());
module.exports = ExpressManager;
//# sourceMappingURL=ExpressManager.js.map