"use strict";
var Logger = require("../../../app/internals/Logger");
var FSUtils = require("../../../utils/FSUtils");
var NotFound = require("../../../responses/NotFound");
var multer = require("multer");
var GalleryInjector = (function () {
    function GalleryInjector(routeInjector) {
        var _this = this;
        this.fileExistsMiddleware = function (req, res, next) {
            var reqPath = req.params.path;
            var path = FSUtils.join(_this.galleryFilepath, reqPath);
            if (!FSUtils.exists(path)) {
                return next(new NotFound(reqPath + " not found"));
            }
            req.filepath = path;
            return next();
        };
        this.routeInjector = routeInjector;
        this.galleryConfig = this.routeInjector.config.env.images && this.routeInjector.config.env.images.gallery || undefined;
    }
    GalleryInjector.create = function (routeInjector) {
        return new GalleryInjector(routeInjector);
    };
    GalleryInjector.prototype.inject = function () {
        if (!this.galleryConfig) {
            GalleryInjector.logger.debug("GalleryConfig is not found. Not Injecting.");
            return;
        }
        GalleryInjector.logger.debug("GalleryConfig found. Injecting.");
        this.galleryEndpoint = this.galleryConfig.endpoint;
        this.galleryFilepath = this.galleryConfig.filepath;
        this.createMulterUpload();
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
        this.routeInjector.app.get(this.galleryEndpoint + "/:path(*)", this.fileExistsMiddleware, function (req, res, next) {
            var path = req.filepath;
            var files = FSUtils.getClassifiedFileMap(path);
            res.json(files);
            res.end();
        });
    };
    GalleryInjector.prototype.handlePostImage = function () {
        var _this = this;
        this.routeInjector.app.post(this.galleryEndpoint + "/:path(*)", this.upload.array("images"), function (req, res, next) {
            var files = req.files;
            var i = 0;
            var path = req.param("path", "");
            var partialPath = _this.galleryEndpoint + "/" + path + "/";
            for (i; i < files.length; i++) {
                files[i] = partialPath + files[i].originalname;
            }
            res.statusCode = 201;
            res.json(files);
            return res.end();
        });
    };
    GalleryInjector.prototype.handleGetImage = function () {
        var express = this.routeInjector.internals.express;
        this.routeInjector.app.use(this.galleryEndpoint, express.static(this.galleryFilepath));
    };
    GalleryInjector.prototype.handleDeleteImage = function () {
        this.routeInjector.app.delete(this.galleryEndpoint + "/:path(*)", this.fileExistsMiddleware, function (req, res, next) {
            FSUtils.remove(req.filepath);
            res.statusCode = 200;
            res.json({
                message: req.filepath + " has been removed"
            });
            return res.end();
        });
    };
    GalleryInjector.prototype.createMulterUpload = function () {
        var _this = this;
        var storage = multer.diskStorage({
            destination: function (req, file, cb) {
                var reqPathParam = req.param("path", ".");
                var path = FSUtils.join(_this.galleryFilepath, reqPathParam);
                if (!FSUtils.exists(path))
                    FSUtils.createDirectory(path);
                cb(null, path);
            },
            filename: function (req, file, cb) {
                cb(null, file.originalname);
            }
        });
        this.upload = multer({
            storage: storage
        });
    };
    GalleryInjector.logger = Logger.getLogger();
    return GalleryInjector;
}());
module.exports = GalleryInjector;
//# sourceMappingURL=GalleryInjector.js.map