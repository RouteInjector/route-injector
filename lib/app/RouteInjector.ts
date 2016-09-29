/// <reference path='../typings/index.d.ts'/>
import Bootstrapper = require("./internals/Bootstrapper");
'use strict';
import AuthManager = require("./internals/AuthManager");
import DBConnection = require("./internals/DBConnection");
import ModelsLoader = require("./internals/ModelsLoader");
import PluginRegistry = require("./internals/PluginRegistry");
import ExpressManager = require("./internals/ExpressManager");
import MiddlewareRegistry = require("./internals/MiddlewareRegistry");
import {Mongoose} from "mongoose";
import Configurations = require("./internals/Configurations");
import Logger = require('./internals/Logger');
import express = require("express-session");
import PageLoader = require("./internals/PageLoader");

class RouteInjector {
    static logger = Logger.getLogger();
    public version = require("../../package.json").version;

    private configurations:Configurations;
    private pluginRegistry:PluginRegistry;
    private dbConnection:DBConnection;
    private modelsLoader:ModelsLoader;
    private expressManager:ExpressManager;
    private authManager:AuthManager;
    private pageLoader:PageLoader;
    private bootstrapper:Bootstrapper;
    //private middlewareRegistry:MiddlewareRegistry;

    constructor() {
        this.printRouteInjectorHeader();
        this.configurations = Configurations.instance();
        this.pluginRegistry = PluginRegistry.create(this.configurations);
    }

    public start(callback:()=>void):void {
        this.setupDependencies();
        this.dbConnection.connect(()=> {
            this.modelsLoader.loadModels();
            this.authManager.loadAuth();
            this.pluginRegistry.onAuthLoaded();
            this.pageLoader.loadPages();
            this.expressManager.buildServer(this);
            this.bootstrapper.bootstrap();
            this.globalize();
            this.expressManager.bind(()=> {
                return callback();
            });
        });
    }

    public loadPlugin(pluginName:string, config:any) {
        RouteInjector.logger.debug('Plugin %s is being loaded', pluginName);
        this.pluginRegistry.addPlugin(pluginName, config);
    }

    private printRouteInjectorHeader() {
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
    }

    private setupDependencies():void {
        this.dbConnection = DBConnection.create(this.configurations);
        this.pageLoader = PageLoader.create(this.configurations, this.pluginRegistry);
        this.expressManager = ExpressManager.create(this.configurations, this.pluginRegistry, this.pageLoader);
        this.modelsLoader = ModelsLoader.create(this.configurations, this.pluginRegistry);
        this.authManager = AuthManager.create(this.configurations, this.modelsLoader);
        this.bootstrapper = Bootstrapper.create(this);
    }

    get config() {
        return this.configurations;
    }

    get internals() {
        return {
            express: this.expressManager.express
        }
    }

    get app() {
        return this.expressManager.app
    }

    get mongoose() {
        return this.dbConnection.mongoose;
    }

    get security() {
        return this.authManager;
    }

    set security(security){
        this.authManager = security;
    }

    get models() {
        return this.modelsLoader.models;
    }

    get log() {
        return RouteInjector.logger;
    }

    get pages() {
        return this.pageLoader.pages;
    }

    get plugins() {
        return this.pluginRegistry.plugins;
    }

    public cache = {middlewares: {}};

    private globalize() {
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
            global['env'] = this.config.env
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
    }

}
export = new RouteInjector();