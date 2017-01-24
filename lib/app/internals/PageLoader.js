///<reference path='../../../typings/index.d.ts'/>
"use strict";
var FSUtils = require("../../utils/FSUtils");
var Logger = require("./Logger");
var PageLoader = (function () {
    function PageLoader(config, pluginRegistry) {
        this.directories = [];
        this._pages = {};
        PageLoader.logger.trace("Creating PageLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }
    PageLoader.create = function (config, pluginRegistry) {
        return new PageLoader(config, pluginRegistry);
    };
    PageLoader.prototype.loadPages = function () {
        this.loadProjectPages();
        this.loadPluginPages();
        this.processPageDirectories();
    };
    Object.defineProperty(PageLoader.prototype, "pages", {
        get: function () {
            return this._pages;
        },
        enumerable: true,
        configurable: true
    });
    PageLoader.prototype.exportNonBackofficePages = function (callback) {
        var _this = this;
        Object.keys(this._pages).forEach(function (pageKey) {
            var page = _this._pages[pageKey];
            if (!page.backoffice) {
                callback(page, pageKey);
            }
        });
    };
    PageLoader.prototype.loadProjectPages = function () {
        var projectPathForPages = FSUtils.join(this.config.appPath, 'pages');
        this.directories = this.directories.concat(this.getDirectories(projectPathForPages));
    };
    PageLoader.prototype.loadPluginPages = function () {
        var _this = this;
        this.pluginRegistry.forEachPlugin(function (plugin) {
            var pluginPathForPags = FSUtils.join(plugin.path, 'pages');
            _this.directories = _this.directories.concat(_this.getDirectories(pluginPathForPags));
        });
    };
    PageLoader.prototype.processPageDirectories = function () {
        var _this = this;
        this.directories.forEach(function (pathForPage) {
            var dirPathSplitted = pathForPage.split(FSUtils.sep);
            var dirPath = dirPathSplitted[dirPathSplitted.length - 1];
            var page = undefined;
            try {
                page = require(pathForPage);
                page.path = pathForPage;
            }
            catch (e) {
                throw new Error("Page (" + dirPath + ") could not be loaded. Index.js is missing");
            }
            PageLoader.throwErrorIfBackofficePageIsNotCorrect(page);
            PageLoader.throwErrorIfPageMeetsLinkingRequirements(page);
            page.js = FSUtils.getAllFilesRecursivelyByType(FSUtils.join(pathForPage, 'public'), '**/*.js', dirPath);
            page.css = FSUtils.getAllFilesRecursivelyByType(FSUtils.join(pathForPage, 'public'), '**/*.css', dirPath);
            _this._pages[dirPath] = page;
        });
    };
    PageLoader.throwErrorIfBackofficePageIsNotCorrect = function (page) {
        if (page.backoffice) {
            if (!page.url || !page.controller || !page.template) {
                throw new Error("Backoffice page must include an url, the controller and it's template to properly render on the angular router");
            }
        }
    };
    PageLoader.throwErrorIfPageMeetsLinkingRequirements = function (page) {
        if (page.backoffice && page.menu && !page.menu.clickTo) {
            new TypeError("You must specify the menu.clickTo property");
        }
        else if (!page.backoffice && page.menu && !page.menu.url) {
            new TypeError("You must specify the menu.url property");
        }
    };
    PageLoader.prototype.getDirectories = function (srcpath) {
        return FSUtils.getDirectories(srcpath).map(function (dir) {
            return FSUtils.join(srcpath, dir);
        });
    };
    return PageLoader;
}());
PageLoader.logger = Logger.getLogger();
module.exports = PageLoader;
//# sourceMappingURL=PageLoader.js.map