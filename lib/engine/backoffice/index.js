'use strict';
//Imports
var utils = require('../../utils/FSUtils');
var path = require('path');

var async = require('async');


var riBackofficeModulePath = utils.getModulePath('ri-backoffice');

// private properties
var injector = undefined;
var app = undefined;
var express = undefined;
var config = undefined;
var log = undefined;
var backofficePath = undefined;

var cachedPages = undefined;

module.exports = BackofficeInjector;

function BackofficeInjector(_injector) {
    injector = _injector;

    app = injector.app;
    express = injector.internals.express;
    config = injector.config;
    backofficePath = config.backoffice.location || '/admin/';
    log = injector.log;
}

BackofficeInjector.prototype.inject = function () {
    // Precache injector pages that afects backoffice
    cacheAndExposePages();

    // Expose /admin or whatever the dev configured
    exposeBackoffice();

    // Expose /admin/extensions (if another path is configured, that will be used instead of admin)
    exposeExtensions();

    // Expose assets to /admin or whatever the dev configured
    exposeAssetsFolder();
};

function cacheAndExposePages() {
    if (injector.pages) {
        cachedPages = [];
        async.forEach(Object.keys(injector.pages), function (k) {
            var page = injector.pages[k];
            if (page.backoffice || (!page.backoffice && page.menu)) {
                cachedPages.push(page);
                // Expose this page online
                if (page.backoffice) {
                    exposeBackofficePages(k, page);
                }
            }
        });
    }
}

function exposeBackofficePages(pageName, page) {
    if (page.backoffice) {
        log.debug("Publishing page:", pageName, "at path", path.join(page.path, 'public'));
        app.use(backofficePath + pageName, express.static(path.join(page.path, 'public')));
    }
}

function exposeExtensions() {
    var projectAssets = getProjectAssets();
    var pluginAssets = getPluginAssets();
    var concatenatedAssets = concatenate(projectAssets, pluginAssets);
    var extensions = {
        pages: cachedPages,
        files: concatenatedAssets
    };
    app.get(backofficePath + 'extensions', function (req, res) {
        res.json(extensions);
        return res.end();
    });
}

function exposeBackoffice() {
    app.use(backofficePath, express.static(path.join(riBackofficeModulePath, "dist")));
}

function exposeAssetsFolder() {
    if (config.backoffice.assetsFolder)
        app.use(backofficePath, express.static(path.join(config.appPath, config.backoffice.assetsFolder)));
}

function getProjectAssets() {
    var assets;
    if (config.backoffice.loaderFile) {
        assets = require(path.join(config.appPath, config.backoffice.loaderFile));
    } else {
        assets = {
            css: [],
            js: []
        };
    }
    return assets;
}

function getPluginAssets() {
    var pluginCustoms = {
        css: [],
        js: []
    };
    for (var pluginName in injector.plugins) {
        injector.log.debug("Injecting custom files for plugin", pluginName);
        concatPluginCustomAssets(pluginCustoms, injector.plugins[pluginName]);
    }
    return pluginCustoms;
}

function concatPluginCustomAssets(obj, plugin) {
    var item = plugin.plugin.config.assets || {};
    if (item.css)
        obj.css = obj.css.concat(item.css);

    if (item.js)
        obj.js = obj.js.concat(item.js);
}

function concatenate(o1, o2) {
    var concatenated = {};
    concatenated.css = o1.css.concat(o2.css);
    concatenated.js = o1.js.concat(o2.js);
    return concatenated;
}
