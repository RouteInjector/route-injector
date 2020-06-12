"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Logger = require("../../../app/internals/Logger");
var FSUtils = require("../../../utils/FSUtils");
var NotFound = require("../../../responses/NotFound");
var multer = require("multer");
var child = require("child_process");
var util_1 = require("util");
var path = require("path");
var fs = require("fs");
var util_2 = require("util");
var sharp = require("sharp");
var mkdirp = require("mkdirp");
var querystring = require("querystring");
sharp.cache(false);
var GalleryInjector = /** @class */ (function () {
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
            var partialPath = _this.prefix + _this.galleryEndpoint + "/" + path;
            if (path) {
                partialPath = partialPath + "/";
            }
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
        var _this = this;
        var IMGR = require('imgr').IMGR;
        var config = this.routeInjector.config.env.images.imgrConfig || {};
        if (config.optimisation == undefined) {
            config.optimisation = this.optimiseImage;
        }
        var imgr = new IMGR(config);
        function supportsWebP(headers) {
            if (headers.accept && headers.accept.includes("image/webp")) {
                /* Por aquí entran chrome y opera */
                return true;
            }
            else {
                if (headers["user-agent"]) {
                    if (headers["user-agent"].includes("Firefox")) {
                        /* Firefox por encima de la 65 ok: */
                        var version = parseFloat(headers["user-agent"].split("/").pop());
                        return version >= 65; /* https://caniuse.com/#search=webp */
                    }
                }
            }
            return false;
        }
        this.routeInjector.app.use(function (req, res, next) { return __awaiter(_this, void 0, void 0, function () {
            function end(err) {
                if (!err)
                    req.url = req.url.split(".").slice(0, -1).join(".") + ".webp";
                else
                    console.error("SHARP: ", err);
                next();
            }
            var detectSize, fileName, fileAbs, stats, maybeSize, size, widthStr, heightStr, width, height, fileNameNoExt, outputDir, outputFile, err_1;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 12, , 13]);
                        if (!(req.url.startsWith(this.prefix + this.galleryEndpoint) && req.method === "GET")) return [3 /*break*/, 10];
                        detectSize = /^[0-9]+x[0-9]*$|^[0-9]*x[0-9]+$|^[0-9]+x[0-9]+$/;
                        fileName = querystring.unescape(req.url).replace(this.prefix + this.galleryEndpoint, "").split("/");
                        if (detectSize.test(fileName[fileName.length - 2]))
                            fileName.splice(-2, 1);
                        fileName = fileName.join("/");
                        fileAbs = path.join(this.routeInjector.config.env.images.path, fileName);
                        return [4 /*yield*/, util_2.promisify(fs.stat)(fileAbs)];
                    case 1:
                        stats = _b.sent();
                        if (!stats.isFile()) return [3 /*break*/, 8];
                        if (!supportsWebP(req.headers)) return [3 /*break*/, 6];
                        maybeSize = req.url.split("/").splice(-2, 1)[0];
                        size = null, widthStr = null, heightStr = null, width = undefined, height = undefined;
                        if (detectSize.test(maybeSize)) {
                            size = maybeSize;
                            _a = size.split("x"), widthStr = _a[0], heightStr = _a[1];
                            width = !isNaN(parseInt(widthStr)) ? parseInt(widthStr) : undefined;
                            height = !isNaN(parseInt(heightStr)) ? parseInt(heightStr) : undefined;
                        }
                        fileNameNoExt = path.basename(fileName, path.extname(fileName));
                        outputDir = path.dirname(fileName);
                        outputFile = path.join(this.routeInjector.config.env.images.cache, outputDir, size || "", fileNameNoExt + ".webp");
                        return [4 /*yield*/, util_2.promisify(fs.exists)(outputFile)];
                    case 2:
                        if (!!(_b.sent())) return [3 /*break*/, 4];
                        return [4 /*yield*/, util_2.promisify(mkdirp)(path.dirname(outputFile))];
                    case 3:
                        _b.sent();
                        sharp(fileAbs).resize(width, height).toFile(outputFile, end);
                        return [3 /*break*/, 5];
                    case 4:
                        req.url = req.url.split(".").slice(0, -1).join(".") + ".webp";
                        next();
                        _b.label = 5;
                    case 5: return [3 /*break*/, 7];
                    case 6:
                        next();
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        next();
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        next();
                        _b.label = 11;
                    case 11: return [3 /*break*/, 13];
                    case 12:
                        err_1 = _b.sent();
                        console.error("WEBP: ", err_1);
                        next();
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        }); });
        imgr.serve(this.routeInjector.config.env.images.path) //folder
            .namespace(this.prefix + this.galleryEndpoint) // /image
            .cacheDir(this.routeInjector.config.env.images.cache)
            .urlRewrite('/:path/:size/:file.:ext') // '/:path/:size/:file.:ext'
            .using(this.routeInjector.app);
    };
    GalleryInjector.prototype.handleDeleteImage = function () {
        var _this = this;
        this.routeInjector.app.delete(this.prefix + this.galleryEndpoint + "/:path(*)", this.getUserIfExists.middleware, this.checkRole(this.deleteImageRoles).middleware, this.fileExistsMiddleware, function (req, res, next) {
            var relativePath = querystring.unescape(req.url).replace(_this.prefix + _this.galleryEndpoint, "");
            FSUtils.removeImage(_this.routeInjector.config.env.images, relativePath);
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