///<reference path='../../../typings/index.d.ts'/>

import ConfigUtils = require("../../utils/ConfigUtils");
'use strict';
import RouteInjector = require("../RouteInjector");
import express = require('express');
import PluginRegistry = require("./PluginRegistry");
import session = require('express-session');
import Configurations = require("./Configurations");
import Logger = require("./Logger");
import FSUtils = require("../../utils/FSUtils");
import Server = require("./server/Server");
import ExpressMiddlewares = require("./express/ExpressMiddlewares");
import RouteLoader = require("./RouteLoader");
import TranslationRepository = require("./TranslationRepository");
import {IMetaPlugin} from "../interfaces/IPlugin";
import {IPlugin} from "../interfaces/IPlugin";
import MiddlewareRegistry = require("./MiddlewareRegistry");
import PageLoader = require("./PageLoader");
import cluster = require("cluster");

var vhost = require("vhost"); //No tsd for vhost


class ExpressManager {
    static logger = Logger.getLogger();
    public app = express();
    private config;
    private pluginRegistry: PluginRegistry;
    private routeLoader: RouteLoader;
    private translationRepository: TranslationRepository;
    private middlewareRegistry: MiddlewareRegistry;
    private pageLoader: PageLoader;

    constructor(config: Configurations, pluginRegistry: PluginRegistry, pageLoader: PageLoader) {
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
    public static create(config: Configurations, pluginRegistry: PluginRegistry, pageLoader: PageLoader) {
        return new ExpressManager(config, pluginRegistry, pageLoader);
    }

    /**
     * Setup and build all Express routers and handlers
     * @param _injector
     */
    public buildServer(_injector): void {
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
    }

    /**
     * Setup express configurations
     */
    private expressSetup() {
        ExpressMiddlewares.expressSetup(this.app, this.config);
    }

    /**
     * Setup express session if enabled
     */
    private sessionSetup() {
        if (this.config.session.enabled) {
            this.app.use(session(this.config.session));
        }
    }

    /**
     * Set route injector's version
     * @param version
     */
    private setVersion(version: string) {
        this.app.use((req, res, next)=> {
            res.header('X-Powered-By', 'RouteInjector ' + version);
            return next();
        });
    }

    /**
     * Enable CORS if developer has enabled on config > application > enableCors
     */
    private enableCorsIfConfigured(): void {
        if (this.config.application.enableCors) {
            this.app.all('*', ExpressMiddlewares.cors());
        }
    }

    /**
     * Export Middlewares
     */
    private exportMiddlewares(): void {
        ExpressManager.logger.debug("Exporting middlewares");
        this.middlewareRegistry.forEachMiddleware((middleware)=> {
            middleware(this.app);
        });
        ExpressManager.logger.debug("");
    }

    /**
     * Export Routes
     */
    private exportRoutes(): void {
        ExpressManager.logger.debug("Exporting routes");
        this.routeLoader.forEachRouteFile((route)=> {
            route(this.app);
        });
        ExpressManager.logger.debug("");
    }

    private exportPages(): void {
        ExpressManager.logger.debug("Exporting pages");
        this.pageLoader.exportNonBackofficePages((page, dir)=> {
            var staticPage = express.static(FSUtils.join(page.path, 'public'));
            if (page.cname) {
                ExpressManager.logger.debug("\t vhosted -> %s maps to %s", page.cname, FSUtils.join(page.path, 'public'));
                this.app.use(vhost(page.cname, staticPage));
            } else {
                ExpressManager.logger.debug("\t /%s maps to %s", dir, FSUtils.join(page.path, 'public'));
                this.app.use('/' + dir, staticPage);
            }
        });
        ExpressManager.logger.debug("");
    }

    /**
     * Export Translations
     */
    private exportTranslations(): void {
        ExpressManager.logger.debug("Exporting translations")
        var dirs = this.translationRepository.getTranslationDirectories();
        dirs.forEach((dir)=> {
            ExpressManager.logger.debug("\t Exporting %s", dir);
            this.app.use("/admin/i18n", this.express.static(dir));
        });
        ExpressManager.logger.info("");
    }

    /**
     * Export Statics
     */
    private exportStatics(): void {
        this.exportApplicationStatics();
        this.exportPluginsStatics();
    }

    /**
     * Export Public
     */
    private exportPublic(): void {
        this.app.use("/", this.express.static(FSUtils.join(__dirname, '..', '..', 'public')));
    }


    /**
     * Export Plugin Statics
     */
    private exportPluginsStatics(): void {
        ExpressManager.logger.info("Exporting Plugin Statics");
        this.pluginRegistry.getUrlAndDirForEachStatics((pluginName, url, dir)=> {
            this.exportStatic(url, dir);
            ExpressManager.logger.debug("\t %s maps to directory %s", url, dir);
        });
        ExpressManager.logger.debug("");
    }

    /**
     * Call PreInject functions for each plugin
     */
    private preInjectPlugins() {
        ExpressManager.logger.info("Calling PreInjecting functions for Plugins");
        this.pluginRegistry.forEachPlugin((metaPlugin: IMetaPlugin)=> {
            var plugin: IPlugin = metaPlugin.plugin;
            ExpressManager.logger.info("\t Calling PreInject on %s", plugin.name);
            if (plugin.preInject)
                plugin.preInject(this.app)
        });
        ExpressManager.logger.info("");
    }

    /**
     * Call PostInject functions for each plugin
     */
    private postInjectPlugins() {
        ExpressManager.logger.info("Calling PostInject functions for Plugins");
        this.pluginRegistry.forEachPlugin((metaPlugin: IMetaPlugin)=> {
            var plugin: IPlugin = metaPlugin.plugin;
            ExpressManager.logger.info("\t Calling PostInject on %s", plugin.name);
            if (plugin.postInject)
                plugin.postInject(this.app)
        });
        ExpressManager.logger.info("");
    }

    /**
     * Export Application Statics
     */
    private exportApplicationStatics() {
        ExpressManager.logger.info("Exporting Application Statics");
        ConfigUtils.create(this.config).getApplicationStatics((url, path)=> {
            this.exportStatic(url, path);
            ExpressManager.logger.debug("\t %s maps to directory /%s", url, FSUtils.relative(this.config.appPath, path));
        });
        ExpressManager.logger.info("");
    }

    /**
     * Export Not Found and General Error Handler for Express
     */
    private errorHandlers(): void {
        if(this.config.application.notFound == undefined) {
            this.app.use(ExpressMiddlewares.notFoundHandler());
        } else {
            if(this.config.application.notFound == "disabled") {
                // do nothing, so 404 can be intercepted in bin/www
            } else if(this.config.application.notFound == "angular") {
                // return index.html without redirect
                let path = FSUtils.join(this.config.appPath, this.config.application.indexPath);
                this.app.use(ExpressMiddlewares.angularNotFoundHandler(path));
            } else {
                // make a redirect to the URL specified.
                this.app.use(ExpressMiddlewares.redirectHandler("http://www.ondho.com"));
            }
        }

        this.app.use(ExpressMiddlewares.errorHandler());
    }

    /**
     * Bind server and callback to alert that the binding is already done
     * @param callback
     */
    public bind(callback: ()=>void): void {
        var server;
        if (this.config.env.ssl && this.config.env.ssl.enabled) {
            ExpressManager.logger.info('HTTPS is enabled');
            var keyFile = this.config.env.ssl.key;
            var certFile = this.config.env.ssl.cert;
            server = Server.createHttpsServer(keyFile, certFile, this.app);
        } else {
            server = Server.createHttpServer(this.app);
        }
        this.pluginRegistry.forEachPlugin((metaPlugin)=>{
            if(metaPlugin.plugin.attachServer){
                metaPlugin.plugin.attachServer(server);
            }
        });
        server.listen(this.config.env.bind.port, ()=> {
            ExpressManager.logger.info('');
            ExpressManager.logger.info('Server listening on port ' + server.address().port);
            ExpressManager.logger.info('Backoffice is located on /admin');
            callback();
        });
    }

    get express() {
        return express;
    }

    private exportStatic(url: string, path: string) {
        this.app.use(url, express.static(path));
    }


}
export = ExpressManager;
