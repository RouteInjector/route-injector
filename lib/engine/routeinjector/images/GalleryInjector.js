"use strict";
var Logger = require("../../../app/internals/Logger");
var GalleryInjector = (function () {
    function GalleryInjector(routeInjector) {
        this.galleryConfig = undefined;
        this.routeInjector = routeInjector;
        this.galleryConfig = this.routeInjector.config.env.image && this.routeInjector.config.env.image.gallery || undefined;
    }
    GalleryInjector.prototype.inject = function () {
        if (!this.galleryConfig) {
            GalleryInjector.logger.debug("GalleryConfig is not found. Not Injecting.");
            return;
        }
        GalleryInjector.logger.debug("GalleryConfig found. Injecting.");
        this.handleGetImagesList();
        this.handlePostImage();
        this.handleGetImage();
        this.handleDeleteImage();
    };
    GalleryInjector.prototype.handleGetImagesList = function () {
    };
    GalleryInjector.prototype.handlePostImage = function () {
    };
    GalleryInjector.prototype.handleGetImage = function () {
    };
    GalleryInjector.prototype.handleDeleteImage = function () {
    };
    GalleryInjector.logger = Logger.getLogger();
    return GalleryInjector;
}());
module.exports = GalleryInjector;
//# sourceMappingURL=GalleryInjector.js.map