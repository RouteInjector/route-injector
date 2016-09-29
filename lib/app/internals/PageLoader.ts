///<reference path='../../typings/index.d.ts'/>

import FSUtils =require('../../utils/FSUtils');
import Logger = require("./Logger");
import Configurations = require("./Configurations");
import PluginRegistry = require("./PluginRegistry");
import {IMetaPlugin} from "../interfaces/IPlugin";

class PageLoader {
    private static logger = Logger.getLogger();
    private config:Configurations;
    private pluginRegistry:PluginRegistry;

    private directories:string[] = [];
    private _pages:{[pagePath:string]:any} = {};

    constructor(config:Configurations, pluginRegistry:PluginRegistry) {
        PageLoader.logger.trace("Creating PageLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }

    public static create(config:Configurations, pluginRegistry:PluginRegistry) {
        return new PageLoader(config, pluginRegistry);
    }

    public loadPages() {
        this.loadProjectPages();
        this.loadPluginPages();
        this.processPageDirectories();
    }

    public get pages() {
        return this._pages;
    }

    public exportNonBackofficePages(callback:(page:any, dir:string)=>void) {
        Object.keys(this._pages).forEach((pageKey)=> {
            var page = this._pages[pageKey];
            if (!page.backoffice) {
                callback(page, pageKey);
            }
        });
    }

    private loadProjectPages() {
        var projectPathForPages = FSUtils.join(this.config.appPath, 'pages');
        this.directories = this.directories.concat(this.getDirectories(projectPathForPages));
    }

    private loadPluginPages() {
        this.pluginRegistry.forEachPlugin((plugin:IMetaPlugin)=> {
            var pluginPathForPags = FSUtils.join(plugin.path, 'pages');
            this.directories = this.directories.concat(this.getDirectories(pluginPathForPags));
        });
    }

    private processPageDirectories() {
        this.directories.forEach((pathForPage) => {
            var dirPathSplitted = pathForPage.split(FSUtils.sep);
            var dirPath = dirPathSplitted[dirPathSplitted.length - 1];

            var page = undefined;
            try {
                page = require(pathForPage);
                page.path = pathForPage;
            } catch (e) {
                throw new Error("Page (" + dirPath + ") could not be loaded. Index.js is missing");
            }

            PageLoader.throwErrorIfBackofficePageIsNotCorrect(page);
            PageLoader.throwErrorIfPageMeetsLinkingRequirements(page);
            page.js = FSUtils.getAllFilesRecursivelyByType(FSUtils.join(pathForPage, 'public'), '**/*.js', dirPath);
            page.css = FSUtils.getAllFilesRecursivelyByType(FSUtils.join(pathForPage, 'public'), '**/*.css', dirPath);

            this._pages[dirPath] = page;
        });
    }

    private static throwErrorIfBackofficePageIsNotCorrect(page) {
        if (page.backoffice) {
            if (!page.url || !page.controller || !page.template) {
                throw new Error("Backoffice page must include an url, the controller and it's template to properly render on the angular router")
            }
        }
    }

    private static throwErrorIfPageMeetsLinkingRequirements(page) {
        if (page.backoffice && page.menu && !page.menu.clickTo) {
            new TypeError("You must specify the menu.clickTo property")
        } else if (!page.backoffice && page.menu && !page.menu.url) {
            new TypeError("You must specify the menu.url property")
        }
    }

    private getDirectories(srcpath) {
        return FSUtils.getDirectories(srcpath).map(function (dir) {
            return FSUtils.join(srcpath, dir);
        })
    }

}
export = PageLoader;