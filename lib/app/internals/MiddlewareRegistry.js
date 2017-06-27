///<reference path='../../../typings/index.d.ts'/>
"use strict";
var FSUtils = require("../../utils/FSUtils");
'use strict';
var Logger = require("./Logger");
var MiddlewareRegistry = (function () {
    function MiddlewareRegistry(config) {
        this._middlewares = {};
        this.config = config;
        MiddlewareRegistry.logger.trace("Creating MiddlewareRegistry instance");
        config.routes = config.routes || {};
        this.customMiddlewareDirs = config.routes.customMiddlewares || [];
    }
    MiddlewareRegistry.create = function (config) {
        return new MiddlewareRegistry(config);
    };
    MiddlewareRegistry.prototype.forEachMiddleware = function (callback) {
        var _this = this;
        this.customMiddlewareDirs.forEach(function (dir) {
            var absFolder = FSUtils.join(_this.config.appPath, dir);
            var files = FSUtils.getFiles(absFolder);
            files.forEach(function (file) {
                var middleware = require(FSUtils.join(absFolder, file));
                callback(middleware.middleware);
            });
        });
    };
    MiddlewareRegistry.prototype.get = function (name) {
        return this._middlewares[name];
    };
    Object.defineProperty(MiddlewareRegistry.prototype, "middlewares", {
        get: function () {
            return this._middlewares;
        },
        enumerable: true,
        configurable: true
    });
    return MiddlewareRegistry;
}());
MiddlewareRegistry.logger = Logger.getLogger(__filename);
module.exports = MiddlewareRegistry;
//# sourceMappingURL=MiddlewareRegistry.js.map