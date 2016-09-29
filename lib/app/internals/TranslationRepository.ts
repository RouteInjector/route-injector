///<reference path='../../typings/index.d.ts'/>
'use strict';
import Configurations = require("./Configurations");

import RouteInjector = require("../RouteInjector");
import ExpressManager = require("./ExpressManager");
import PluginRegistry = require("./PluginRegistry");
import FSUtils = require("../../utils/FSUtils");
import {IMetaPlugin} from "../interfaces/IPlugin";
import Logger = require("./Logger");

class TranslationRepository {
    private static logger = Logger.getLogger();
    private pluginRegistry:PluginRegistry;
    private config;
    private i18nDirs:string[] = [];
    private i18nFiles:string[] = [];

    constructor(config:Configurations, pluginRegistry:PluginRegistry) {
        TranslationRepository.logger.trace("Creating TranslationRepository instance");
        this.pluginRegistry = pluginRegistry;
        this.config = config;
        this.loadProjectTranslations();
        this.loadPluginsTranslations();
    }


    public static create(config:Configurations, pluginRegistry:PluginRegistry) {
        return new TranslationRepository(config, pluginRegistry);
    }

    /**
     * Get translation directories
     * @returns {string[]}
     */
    public getTranslationDirectories():string[]{
        return this.i18nDirs;
    }

    /**
     * Get all i18n files
     * @returns {string[]}
     */
    public get i18n():string[] {
        return this.i18nFiles;
    }

    /**
     * Load project translations and cache them using it's path
     */
    private loadProjectTranslations() {
        this.cacheTranslationDirectories(this.config.appPath);
    }

    /**
     * Load plugin translations and cache them using it's path
     */
    private loadPluginsTranslations() {
        this.pluginRegistry.forEachPlugin((plugin:IMetaPlugin)=> {
            this.cacheTranslationDirectories(plugin.path);
        });
    }

    /**
     * Cache Translation Directories given a directory
     * @param p
     */
    private cacheTranslationDirectories(p) {
        var dir = FSUtils.join(p, 'i18n');
        if (FSUtils.exists(dir)) {
            this.i18nDirs.push(dir);
            this.cacheTranslationFiles(dir);
        }
    }

    /**
     * Cache Translation Files given a Translation Dir
     * @param dir
     */
    private cacheTranslationFiles(dir):void {
        var translations = FSUtils.getDirectories(dir);
        this.i18nFiles = this.i18nFiles.concat(translations);
    }
}
export = TranslationRepository;