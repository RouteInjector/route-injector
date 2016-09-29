///<reference path='../../typings/index.d.ts'/>
'use strict';
import Logger = require("./Logger");
import RouteInjector = require("../RouteInjector");
import PluginRegistry = require("./PluginRegistry");
import ExpressManager = require("./ExpressManager");
import {IPlugin} from "../interfaces/IPlugin";
import FSUtils = require("../../utils/FSUtils");
import Configurations = require("./Configurations");
import {IMetaPlugin} from "../interfaces/IPlugin";

/**
 * @author Gerard Solé
 */
class RouteLoader {
    private static logger = Logger.getLogger();
    private pluginRegistry;
    private config;

    constructor(config:Configurations, pluginRegistry:PluginRegistry) {
        RouteLoader.logger.trace("Creating RouteLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }

    public static create(config:Configurations, pluginRegistry:PluginRegistry) {
        return new RouteLoader(config, pluginRegistry);
    }

    public forEachRouteFile(callback:(route:Function)=>void){
        this.loadProjectRoutes(callback);
        this.loadPluginRoutes(callback);
    }

    private loadProjectRoutes(callback:(route:Function)=>void) {
        RouteLoader.logger.debug("Loading Project Routes");
        var routeDirs = this.config.routes.customRoutes || [];
        routeDirs.forEach((routeDir)=> {
            var absFolder = FSUtils.join(this.config.appPath, routeDir);
            this.loadRoutes(absFolder, callback);
        });
        RouteLoader.logger.debug("");
    }

    private loadPluginRoutes(callback:(route:Function)=>void) {
        RouteLoader.logger.debug("Loading Plugin Routes");
        var plugins:IMetaPlugin[] = this.pluginRegistry.getPluginsWithRoutes();
        plugins.forEach((plugin:IMetaPlugin)=> {
            var routes = plugin.plugin.routes;
            routes.forEach((route)=> {
                var dir = FSUtils.join(plugin.path, route);
                this.loadRoutes(dir, callback);
            });
        });
        RouteLoader.logger.debug("");
    }

    private loadRoutes(srcpath, callback:(route:Function)=>void) {
        if (FSUtils.exists(srcpath)) {
            FSUtils.getFiles(srcpath).forEach((file)=> {
                var routeFile = require(FSUtils.join(srcpath, file));
                if (routeFile.route) {
                    callback(routeFile.route);
                    RouteLoader.logger.debug("\t %s", file);
                } else {
                    RouteLoader.logger.warn("File %s does not provide a route function. So it will not work neither their routes will be injected", file);
                }
            });
        }
        else {
            RouteLoader.logger.error("Directory %s does not exists", srcpath);
        }
    }
}
export=RouteLoader;