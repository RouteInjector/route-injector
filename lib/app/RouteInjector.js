"use strict";
/// <reference path='../typings/index.d.ts'/>
var Bootstrapper = require("./internals/Bootstrapper");
'use strict';
var AuthManager = require("./internals/AuthManager");
var DBConnection = require("./internals/DBConnection");
var ModelsLoader = require("./internals/ModelsLoader");
var PluginRegistry = require("./internals/PluginRegistry");
var ExpressManager = require("./internals/ExpressManager");
var Configurations = require("./internals/Configurations");
var Logger = require('./internals/Logger');
var PageLoader = require("./internals/PageLoader");
var RouteInjector = (function () {
    //private middlewareRegistry:MiddlewareRegistry;
    function RouteInjector() {
        this.version = require("../../package.json").version;
        this.cache = { middlewares: {} };
        this.printRouteInjectorHeader();
        this.configurations = Configurations.instance();
        this.pluginRegistry = PluginRegistry.create(this.configurations);
    }
    RouteInjector.prototype.start = function (callback) {
        var _this = this;
        this.setupDependencies();
        this.dbConnection.connect(function () {
            _this.modelsLoader.loadModels();
            _this.authManager.loadAuth();
            _this.pluginRegistry.onAuthLoaded();
            _this.pageLoader.loadPages();
            _this.expressManager.buildServer(_this);
            _this.bootstrapper.bootstrap();
            _this.globalize();
            _this.expressManager.bind(function () {
                return callback();
            });
        });
    };
    RouteInjector.prototype.loadPlugin = function (pluginName, config) {
        RouteInjector.logger.debug('Plugin %s is being loaded', pluginName);
        this.pluginRegistry.addPlugin(pluginName, config);
    };
    RouteInjector.prototype.printRouteInjectorHeader = function () {
        RouteInjector.logger.info("      __________               __           ");
        RouteInjector.logger.info("      \\______   \\ ____  __ ___/  |_  ____   ");
        RouteInjector.logger.info("       |       _//  _ \\|  |  \\   __\\/ __ \\  ");
        RouteInjector.logger.info("       |    |   (  <_> )  |  /|  | \\  ___/  ");
        RouteInjector.logger.info("       |____|_  /\\____/|____/ |__|  \\___  > ");
        RouteInjector.logger.info("              \\/                        \\/  ");
        RouteInjector.logger.info(" .___            __               __                  ");
        RouteInjector.logger.info(" |   | ____     |__| ____   _____/  |_  ___________   ");
        RouteInjector.logger.info(" |   |/    \\    |  |/ __ \\_/ ___\\   __\\/  _ \\_  __ \\  ");
        RouteInjector.logger.info(" |   |   |  \\   |  \\  ___/\\  \\___|  | (  <_> )  | \\/  ");
        RouteInjector.logger.info(" |___|___|  /\\__|  |\\___  >\\___  >__|  \\____/|__|     ");
        RouteInjector.logger.info("          \\/\\______|    \\/     \\/                     ");
        RouteInjector.logger.info('\n');
        RouteInjector.logger.info('RouteInjector version: %s', this.version);
    };
    RouteInjector.prototype.setupDependencies = function () {
        this.dbConnection = DBConnection.create(this.configurations);
        this.pageLoader = PageLoader.create(this.configurations, this.pluginRegistry);
        this.expressManager = ExpressManager.create(this.configurations, this.pluginRegistry, this.pageLoader);
        this.modelsLoader = ModelsLoader.create(this.configurations, this.pluginRegistry);
        this.authManager = AuthManager.create(this.configurations, this.modelsLoader);
        this.bootstrapper = Bootstrapper.create(this);
    };
    Object.defineProperty(RouteInjector.prototype, "config", {
        get: function () {
            return this.configurations;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "internals", {
        get: function () {
            return {
                express: this.expressManager.express
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "app", {
        get: function () {
            return this.expressManager.app;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "mongoose", {
        get: function () {
            return this.dbConnection.mongoose;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "security", {
        get: function () {
            return this.authManager;
        },
        set: function (security) {
            this.authManager = security;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "models", {
        get: function () {
            return this.modelsLoader.models;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "log", {
        get: function () {
            return RouteInjector.logger;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "pages", {
        get: function () {
            return this.pageLoader.pages;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(RouteInjector.prototype, "plugins", {
        get: function () {
            return this.pluginRegistry.plugins;
        },
        enumerable: true,
        configurable: true
    });
    RouteInjector.prototype.globalize = function () {
        RouteInjector.logger.info('Make Globals:');
        if (this.config.globals.logger) {
            RouteInjector.logger.info('\t log');
            global['log'] = this.log;
        }
        if (this.config.globals.express) {
            RouteInjector.logger.info('\t internals -> express');
            global['express'] = this.internals.express;
        }
        if (this.config.globals.app) {
            RouteInjector.logger.info('\t app');
            global['app'] = this.app;
        }
        if (this.config.globals.mongoose) {
            RouteInjector.logger.info('\t mongoose');
            global['mongoose'] = this.mongoose;
        }
        if (this.config.globals.env) {
            RouteInjector.logger.info('\t env');
            global['env'] = this.config.env;
        }
        if (this.config.globals.models) {
            RouteInjector.logger.info('\t models');
            this.modelsLoader.forEachModel(function (Model) {
                RouteInjector.logger.info('\t\t ', Model.modelName);
                global[Model.modelName] = Model;
            });
        }
        if (this.config.globals.security) {
            RouteInjector.logger.info('\t security');
            global['security'] = this.security;
        }
    };
    RouteInjector.logger = Logger.getLogger();
    return RouteInjector;
}());
module.exports = new RouteInjector();
//# sourceMappingURL=RouteInjector.js.map