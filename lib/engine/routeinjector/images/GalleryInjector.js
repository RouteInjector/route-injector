"use strict";
var Logger = require("../../../app/internals/Logger");
var FSUtils = require("../../../utils/FSUtils");
var NotFound = require("../../../responses/NotFound");
var multer = require("multer");
var child = require("child_process");
var util_1 = require("util");
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
        this.prefix = this.routeInjector.config.routes.prefix;
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
        this.loadConfiguration();
        this.loadSecurityModule();
        this.createGalleryFilepathIfRequired();
        this.setupMulterMiddleware();
        this.handleGetImage();
        this.handleGetImagesList();
        this.handlePostImage();
        this.handleDeleteImage();
    };
    GalleryInjector.prototype.createGalleryFilepathIfRequired = function () {
        if (FSUtils.exists(this.galleryFilepath))
            return;
        GalleryInjector.logger.debug("[ GalleryInjector ] -> Creating filepath", this.galleryFilepath);
        FSUtils.createDirectory(this.galleryFilepath);
    };
    GalleryInjector.prototype.loadConfiguration = function () {
        this.galleryEndpoint = this.galleryConfig.endpoint;
        this.galleryFilepath = this.galleryConfig.filepath;
        this.listDirectoryRoles = this.galleryConfig.listDirectory;
        this.postImageRoles = this.galleryConfig.postImage;
        this.deleteImageRoles = this.galleryConfig.deleteImage;
    };
    GalleryInjector.prototype.loadSecurityModule = function () {
        this.checkRole = this.routeInjector.security.checkRole;
        this.getUserIfExists = this.routeInjector.security.getUserIfExists;
    };
    GalleryInjector.prototype.handleGetImagesList = function () {
        this.routeInjector.app.get(this.prefix + this.galleryEndpoint + "/:path(*)", this.getUserIfExists.middleware, this.checkRole(this.listDirectoryRoles).middleware, this.fileExistsMiddleware, function (req, res, next) {
            var path = req.filepath;
            var files = FSUtils.getClassifiedFileMap(path);
            res.json(files);
            res.end();
        });
    };
    GalleryInjector.prototype.handlePostImage = function () {
        var _this = this;
        this.routeInjector.app.post(this.prefix + this.galleryEndpoint + "/:path(*)", this.getUserIfExists.middleware, this.checkRole(this.postImageRoles).middleware, this.upload.array("file[]"), function (req, res, next) {
            var files = req.files;
            var path = req.param("path", "");
            if (path !== "") {
                FSUtils.createDirectory(FSUtils.join(_this.galleryFilepath, path));
            }
            var partialPath = _this.galleryEndpoint + "/" + path + "/";
            for (var i = 0; i < files.length; i++) {
                files[i] = partialPath + files[i].originalname;
            }
            res.statusCode = 201;
            res.json(files);
            return res.end();
        });
    };
    GalleryInjector.prototype.optimiseImage = function (image, callback) {
        GalleryInjector.logger.debug("OPTIMIZING ", image);
        if (/\.png$/i.test(image)) {
            GalleryInjector.logger.debug("PNG", image);
            image = image.replace("$", "\\$");
            var p = child.exec(util_1.format('optipng "%s"', image), callback);
            p.stdout.on('data', function (data) {
                GalleryInjector.logger.debug(data);
            });
            p.stderr.on('data', function (data) {
                GalleryInjector.logger.debug(data);
            });
        }
        else if (/\.jpe?g$/i.test(image)) {
            image = image.replace("$", "\\$");
            GalleryInjector.logger.debug("JPEG ", image);
            var p = child.exec(util_1.format('jpegoptim -m90 -o "%s"', image), callback);
            p.stdout.on('data', function (data) {
                GalleryInjector.logger.debug(data);
            });
            p.stderr.on('data', function (data) {
                GalleryInjector.logger.debug(data);
            });
        }
        else {
            callback();
        }
    };
    GalleryInjector.prototype.handleGetImage = function () {
        var IMGR = require('imgr').IMGR;
        var config = this.routeInjector.config.env.images.imgrConfig || {};
        if (config.optimisation == undefined) {
            config.optimisation = this.optimiseImage;
        }
        var imgr = new IMGR(config);
        imgr.serve(this.routeInjector.config.env.images.path) //folder
            .namespace(this.prefix + this.galleryEndpoint) // /image
            .cacheDir(this.routeInjector.config.env.images.cache)
            .urlRewrite('/:path/:size/:file.:ext') // '/:path/:size/:file.:ext'
            .using(this.routeInjector.app);
    };
    GalleryInjector.prototype.handleDeleteImage = function () {
        this.routeInjector.app.delete(this.prefix + this.galleryEndpoint + "/:path(*)", this.getUserIfExists.middleware, this.checkRole(this.deleteImageRoles).middleware, this.fileExistsMiddleware, function (req, res, next) {
            FSUtils.remove(req.filepath);
            res.statusCode = 200;
            res.json({
                message: req.filepath + " has been removed"
            });
            return res.end();
        });
    };
    GalleryInjector.prototype.setupMulterMiddleware = function () {
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