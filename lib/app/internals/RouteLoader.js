///<reference path='../../../typings/index.d.ts'/>
'use strict';
var Logger = require("./Logger");
var FSUtils = require("../../utils/FSUtils");
/**
 * @author Gerard Solé
 */
var RouteLoader = (function () {
    function RouteLoader(config, pluginRegistry) {
        RouteLoader.logger.trace("Creating RouteLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }
    RouteLoader.create = function (config, pluginRegistry) {
        return new RouteLoader(config, pluginRegistry);
    };
    RouteLoader.prototype.forEachRouteFile = function (callback) {
        this.loadProjectRoutes(callback);
        this.loadPluginRoutes(callback);
    };
    RouteLoader.prototype.loadProjectRoutes = function (callback) {
        var _this = this;
        RouteLoader.logger.debug("Loading Project Routes");
        var routeDirs = this.config.routes.customRoutes || [];
        routeDirs.forEach(function (routeDir) {
            var absFolder = FSUtils.join(_this.config.appPath, routeDir);
            _this.loadRoutes(absFolder, callback);
        });
        RouteLoader.logger.debug("");
    };
    RouteLoader.prototype.loadPluginRoutes = function (callback) {
        var _this = this;
        RouteLoader.logger.debug("Loading Plugin Routes");
        var plugins = this.pluginRegistry.getPluginsWithRoutes();
        plugins.forEach(function (plugin) {
            var routes = plugin.plugin.routes;
            routes.forEach(function (route) {
                var dir = FSUtils.join(plugin.path, route);
                _this.loadRoutes(dir, callback);
            });
        });
        RouteLoader.logger.debug("");
    };
    RouteLoader.prototype.loadRoutes = function (srcpath, callback) {
        if (FSUtils.exists(srcpath)) {
            FSUtils.getFiles(srcpath).forEach(function (file) {
                var routeFile = require(FSUtils.join(srcpath, file));
                if (routeFile.route) {
                    callback(routeFile.route);
                    RouteLoader.logger.debug("\t %s", file);
                }
                else {
                    RouteLoader.logger.warn("File %s does not provide a route function. So it will not work neither their routes will be injected", file);
                }
            });
        }
        else {
            RouteLoader.logger.error("Directory %s does not exists", srcpath);
        }
    };
    RouteLoader.logger = Logger.getLogger();
    return RouteLoader;
}());
module.exports = RouteLoader;
//# sourceMappingURL=RouteLoader.js.map