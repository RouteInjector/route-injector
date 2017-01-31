///<reference path='../../../typings/index.d.ts'/>
'use strict';
var FSUtils = require("../../utils/FSUtils");
var Logger = require("./Logger");
var TranslationRepository = (function () {
    function TranslationRepository(config, pluginRegistry) {
        this.i18nDirs = [];
        this.i18nFiles = [];
        TranslationRepository.logger.trace("Creating TranslationRepository instance");
        this.pluginRegistry = pluginRegistry;
        this.config = config;
        this.loadProjectTranslations();
        this.loadPluginsTranslations();
    }
    TranslationRepository.create = function (config, pluginRegistry) {
        return new TranslationRepository(config, pluginRegistry);
    };
    /**
     * Get translation directories
     * @returns {string[]}
     */
    TranslationRepository.prototype.getTranslationDirectories = function () {
        return this.i18nDirs;
    };
    Object.defineProperty(TranslationRepository.prototype, "i18n", {
        /**
         * Get all i18n files
         * @returns {string[]}
         */
        get: function () {
            return this.i18nFiles;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Load project translations and cache them using it's path
     */
    TranslationRepository.prototype.loadProjectTranslations = function () {
        this.cacheTranslationDirectories(this.config.appPath);
    };
    /**
     * Load plugin translations and cache them using it's path
     */
    TranslationRepository.prototype.loadPluginsTranslations = function () {
        var _this = this;
        this.pluginRegistry.forEachPlugin(function (plugin) {
            _this.cacheTranslationDirectories(plugin.path);
        });
    };
    /**
     * Cache Translation Directories given a directory
     * @param p
     */
    TranslationRepository.prototype.cacheTranslationDirectories = function (p) {
        var dir = FSUtils.join(p, 'i18n');
        if (FSUtils.exists(dir)) {
            this.i18nDirs.push(dir);
            this.cacheTranslationFiles(dir);
        }
    };
    /**
     * Cache Translation Files given a Translation Dir
     * @param dir
     */
    TranslationRepository.prototype.cacheTranslationFiles = function (dir) {
        var translations = FSUtils.getDirectories(dir);
        this.i18nFiles = this.i18nFiles.concat(translations);
    };
    TranslationRepository.logger = Logger.getLogger();
    return TranslationRepository;
}());
module.exports = TranslationRepository;
//# sourceMappingURL=TranslationRepository.js.map