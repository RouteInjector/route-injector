"use strict";
var Logger = require("../../../app/internals/Logger");
var FSUtils = require("../../../utils/FSUtils");
var GalleryInjector = (function () {
    function GalleryInjector(routeInjector) {
        this.routeInjector = routeInjector;
        this.galleryConfig = this.routeInjector.config.env.images && this.routeInjector.config.env.images.gallery || undefined;
    }
    GalleryInjector.prototype.inject = function () {
        if (!this.galleryConfig) {
            GalleryInjector.logger.debug("GalleryConfig is not found. Not Injecting.");
            return;
        }
        GalleryInjector.logger.debug("GalleryConfig found. Injecting.");
        this.galleryEndpoint = this.galleryConfig.endpoint;
        this.galleryFilepath = this.galleryConfig.filepath;
        this.createFilepathIfNotExist();
        this.handleGetImage();
        this.handleGetImagesList();
        this.handlePostImage();
        this.handleDeleteImage();
    };
    GalleryInjector.prototype.createFilepathIfNotExist = function () {
        if (FSUtils.exists(this.galleryFilepath))
            return;
        GalleryInjector.logger.debug("[ GalleryInjector ] -> Creating filepath", this.galleryFilepath);
        FSUtils.createDirectory(this.galleryFilepath);
    };
    GalleryInjector.prototype.handleGetImagesList = function () {
        var _this = this;
        this.routeInjector.app.get(this.galleryEndpoint + "/:path(*)", function (req, res) {
            var path = FSUtils.join(_this.galleryFilepath, req.params.path);
            var expression = "*/";
            var dirprefix = "";
            GalleryInjector.logger.debug("[ GalleryInjector ] -> HandleGetImagesList ->", path);
            var files = FSUtils.getClassifiedFileMap(path);
            res.json(files);
            res.end();
        });
    };
    GalleryInjector.prototype.handlePostImage = function () {
        this.routeInjector.app.post(this.galleryEndpoint, function (req, res) {
        });
    };
    GalleryInjector.prototype.handleGetImage = function () {
        var express = this.routeInjector.internals.express;
        this.routeInjector.app.use(this.galleryEndpoint, express.static(this.galleryFilepath));
    };
    GalleryInjector.prototype.handleDeleteImage = function () {
        this.routeInjector.app.delete(this.galleryEndpoint, function (req, res) {
        });
    };
    GalleryInjector.create = function (routeInjector) {
        return new GalleryInjector(routeInjector);
    };
    GalleryInjector.logger = Logger.getLogger();
    return GalleryInjector;
}());
module.exports = GalleryInjector;
//# sourceMappingURL=GalleryInjector.js.map