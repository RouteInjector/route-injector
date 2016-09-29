/**
 * Created by gerard on 1/18/16.
 */
/// <reference path='../../typings/index.d.ts'/>
import Logger = require("./Logger");
import FSUtils = require("../../utils/FSUtils");
import path = require('path');
import {IPlugin} from "../interfaces/IPlugin";
import {IMetaPlugin} from "../interfaces/IPlugin";
import Configurations = require("./Configurations");

class PluginRegistry {
    private static logger = Logger.getLogger();
    private config:Configurations;
    private _plugins:{[pluginName:string]:IMetaPlugin} = {};

    constructor(config:Configurations) {
        PluginRegistry.logger.trace("Creating ModelsLoader instance");
        this.config = config;
    }

    public static create(config:Configurations):PluginRegistry {
        return new PluginRegistry(config);
    }

    /**
     * Add a new plugin to RouteInjector.
     * @param pluginName module Name (or path) It's used on require
     * @param pluginConfig This configuration is customized by the user, and will be passed to the plugin init function
     */
    public addPlugin(pluginName:string, pluginConfig:any):void {
        var Plugin:IMetaPlugin = {
            plugin: require(pluginName),
            path: PluginRegistry.getPluginPath(pluginName)
        };
        Plugin.plugin.init(pluginConfig);
        this.plugins[pluginName] = Plugin;
    }

    /**
     * Call plugins that should modify the auth system.
     */
    public onAuthLoaded() {
        PluginRegistry.logger.trace("Plugin registry - onAuthLoaded");
        this.forEachPlugin((plugin:IMetaPlugin)=> {
            if (plugin.plugin.onAuthLoaded) {
                PluginRegistry.logger.trace("\t %s", plugin.plugin.name);
                plugin.plugin.onAuthLoaded();
            }
        });
    }

    /**
     * Get which plugins are loaded to the system
     * @returns {string[]}
     */
    public getPluginNames():string [] {
        return Object.keys(this.plugins);
    }

    /**
     * Get a plugin by it's name (name can also be a path)
     * @param pluginName
     * @returns {IMetaPlugin}
     */
    public getPlugin(pluginName:string):IMetaPlugin {
        return this.plugins[pluginName];
    }

    /**
     * Helper wich iterates all the plugins
     * @param callback Function expecting a plugin
     */
    public forEachPlugin(callback:(plugin:IMetaPlugin)=>void) {
        var pluginKeys = this.getPluginNames();
        pluginKeys.forEach((pluginName:string)=> {
            callback(this.getPlugin(pluginName));
        });
    }

    public getPluginsWithStatics():IMetaPlugin[] {
        var plugins = [];
        this.forEachPlugin((plugin:IMetaPlugin)=> {
            if (plugin.plugin.statics && plugin.plugin.statics.length) {
                plugins.push(plugin);
            }
        });
        return plugins;
    }

    public getUrlAndDirForEachStatics(callback:(pluginName:string, url:string, dir:string)=>void) {
        var pluginsWithStatics = this.getPluginsWithStatics();
        pluginsWithStatics.forEach((plugin:IMetaPlugin)=> {
            plugin.plugin.statics.forEach((staticExport)=> {
                var staticDirectory = FSUtils.join(plugin.path, staticExport.folder);
                if (FSUtils.exists(staticDirectory)) {
                    callback(plugin.plugin.name, staticExport.url, staticDirectory);
                }
            });
        });
    }

    /**
     * Get the plugins that have custom routes available
     * @returns {Array}
     */
    public getPluginsWithRoutes():IMetaPlugin[] {
        var plugins = [];
        this.forEachPlugin((metaPlugin:IMetaPlugin)=> {
            if (metaPlugin.plugin.routes && metaPlugin.plugin.routes.length) {
                plugins.push(metaPlugin);
            }
        });
        return plugins;
    }

    /**
     * Get the plugins that have translations available
     * @returns {Array}
     */
    public getPluginsWithTranslations():IMetaPlugin[] {
        var plugins = [];
        this.forEachPlugin((plugin:IMetaPlugin)=> {
            var translationsPath = path.join(plugin.path, "i18n");
            if (FSUtils.exists(translationsPath)) {
                plugins.push(plugin);
            }
        });
        return plugins;
    }

    /**
     *
     * @returns {{}}
     */
    get plugins():{[pluginName:string]:IMetaPlugin} {
        return this._plugins;
    }

    /**
     * Get plugin path using it's plugin index
     * @param pluginName
     * @returns {string}
     */
    private static getPluginPath(pluginName:string) {
        return FSUtils.getModulePath(pluginName);
    }

}
export = PluginRegistry;