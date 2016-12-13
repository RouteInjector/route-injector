/**
 * Created by gerard on 1/18/16.
 */
/// <reference path='../../../typings/index.d.ts'/>
"use strict";
var Logger = require("./Logger");
var FSUtils = require("../../utils/FSUtils");
var path = require("path");
var PluginRegistry = (function () {
    function PluginRegistry(config) {
        this._plugins = {};
        PluginRegistry.logger.trace("Creating ModelsLoader instance");
        this.config = config;
    }
    PluginRegistry.create = function (config) {
        return new PluginRegistry(config);
    };
    /**
     * Add a new plugin to RouteInjector.
     * @param pluginName module Name (or path) It's used on require
     * @param pluginConfig This configuration is customized by the user, and will be passed to the plugin init function
     */
    PluginRegistry.prototype.addPlugin = function (pluginName, pluginConfig) {
        var Plugin = {
            plugin: require(pluginName),
            path: PluginRegistry.getPluginPath(pluginName)
        };
        Plugin.plugin.init(pluginConfig);
        this.plugins[pluginName] = Plugin;
    };
    /**
     * Call plugins that should modify the auth system.
     */
    PluginRegistry.prototype.onAuthLoaded = function () {
        PluginRegistry.logger.trace("Plugin registry - onAuthLoaded");
        this.forEachPlugin(function (plugin) {
            if (plugin.plugin.onAuthLoaded) {
                PluginRegistry.logger.trace("\t %s", plugin.plugin.name);
                plugin.plugin.onAuthLoaded();
            }
        });
    };
    /**
     * Get which plugins are loaded to the system
     * @returns {string[]}
     */
    PluginRegistry.prototype.getPluginNames = function () {
        return Object.keys(this.plugins);
    };
    /**
     * Get a plugin by it's name (name can also be a path)
     * @param pluginName
     * @returns {IMetaPlugin}
     */
    PluginRegistry.prototype.getPlugin = function (pluginName) {
        return this.plugins[pluginName];
    };
    /**
     * Helper wich iterates all the plugins
     * @param callback Function expecting a plugin
     */
    PluginRegistry.prototype.forEachPlugin = function (callback) {
        var _this = this;
        var pluginKeys = this.getPluginNames();
        pluginKeys.forEach(function (pluginName) {
            callback(_this.getPlugin(pluginName));
        });
    };
    PluginRegistry.prototype.getPluginsWithStatics = function () {
        var plugins = [];
        this.forEachPlugin(function (plugin) {
            if (plugin.plugin.statics && plugin.plugin.statics.length) {
                plugins.push(plugin);
            }
        });
        return plugins;
    };
    PluginRegistry.prototype.getUrlAndDirForEachStatics = function (callback) {
        var pluginsWithStatics = this.getPluginsWithStatics();
        pluginsWithStatics.forEach(function (plugin) {
            plugin.plugin.statics.forEach(function (staticExport) {
                var staticDirectory = FSUtils.join(plugin.path, staticExport.folder);
                if (FSUtils.exists(staticDirectory)) {
                    callback(plugin.plugin.name, staticExport.url, staticDirectory);
                }
            });
        });
    };
    /**
     * Get the plugins that have custom routes available
     * @returns {Array}
     */
    PluginRegistry.prototype.getPluginsWithRoutes = function () {
        var plugins = [];
        this.forEachPlugin(function (metaPlugin) {
            if (metaPlugin.plugin.routes && metaPlugin.plugin.routes.length) {
                plugins.push(metaPlugin);
            }
        });
        return plugins;
    };
    /**
     * Get the plugins that have translations available
     * @returns {Array}
     */
    PluginRegistry.prototype.getPluginsWithTranslations = function () {
        var plugins = [];
        this.forEachPlugin(function (plugin) {
            var translationsPath = path.join(plugin.path, "i18n");
            if (FSUtils.exists(translationsPath)) {
                plugins.push(plugin);
            }
        });
        return plugins;
    };
    Object.defineProperty(PluginRegistry.prototype, "plugins", {
        /**
         *
         * @returns {{}}
         */
        get: function () {
            return this._plugins;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Get plugin path using it's plugin index
     * @param pluginName
     * @returns {string}
     */
    PluginRegistry.getPluginPath = function (pluginName) {
        return FSUtils.getModulePath(pluginName);
    };
    return PluginRegistry;
}());
PluginRegistry.logger = Logger.getLogger();
module.exports = PluginRegistry;
//# sourceMappingURL=PluginRegistry.js.map