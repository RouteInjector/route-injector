import {IInternalRouteInjector} from "../../../app/interfaces/IRouteInjector";
import Logger = require("../../../app/internals/Logger");
import FSUtils = require("../../../utils/FSUtils");
import NotFound = require("../../../responses/NotFound");
import multer = require("multer");
import {Request} from "express";


class GalleryInjector {
    static logger = Logger.getLogger();

    private routeInjector: IInternalRouteInjector;
    private galleryConfig: IGalleryConfig;

    private galleryEndpoint: string;
    private galleryFilepath: string;

    private upload;

    constructor(routeInjector: IInternalRouteInjector) {
        this.routeInjector = routeInjector;
        this.galleryConfig = this.routeInjector.config.env.images && this.routeInjector.config.env.images.gallery || undefined;
    }

    public static create(routeInjector: IInternalRouteInjector): GalleryInjector {
        return new GalleryInjector(routeInjector);
    }

    public inject() {
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
    }

    private createFilepathIfNotExist() {
        if (FSUtils.exists(this.galleryFilepath))
            return;
        GalleryInjector.logger.debug("[ GalleryInjector ] -> Creating filepath", this.galleryFilepath);
        FSUtils.createDirectory(this.galleryFilepath)
    }

    private handleGetImagesList() {
        this.routeInjector.app.get(this.galleryEndpoint + "/:path(*)", this.fileExistsMiddleware, (req, res, next) => {
            let path = req.filepath;
            let files = FSUtils.getClassifiedFileMap(path);
            res.json(files);
            res.end();
        });
    }

    private handlePostImage() {
        this.routeInjector.app.post(this.galleryEndpoint + "/:path(*)", this.upload.array("images"), (req, res, next) => {
            let files = req.files;
            let i = 0;
            let path = req.param("path", "");
            for (i; i < files.length; i++) {
                files[i] = this.galleryEndpoint + "/" + path + "/" + files[i].originalname;
            }
            res.statusCode = 201;
            res.json(files);
            return res.end();
        });
    }

    private handleGetImage() {
        let express = this.routeInjector.internals.express;
        this.routeInjector.app.use(this.galleryEndpoint, express.static(this.galleryFilepath));
    }

    private handleDeleteImage() {
        this.routeInjector.app.delete(this.galleryEndpoint + "/:path(*)", this.fileExistsMiddleware, (req, res, next) => {
            FSUtils.remove(req.filepath);
            res.statusCode = 200;
            res.json({
                message: req.filepath + " has been removed"
            });
            return res.end();
        });
    }

    private fileExistsMiddleware = (req, res, next) => {
        let reqPath = req.params.path;
        let path = FSUtils.join(this.galleryFilepath, reqPath);
        if (!FSUtils.exists(path)) {
            return next(new NotFound(reqPath + " not found"));
        }
        req.filepath = path;
        return next();
    };

    private createMulterUpload() {
        let storage = multer.diskStorage({
            destination: (req, file, cb) => {
                let reqPathParam = (req as Request).param("path", ".");
                let path = FSUtils.join(this.galleryFilepath, reqPathParam)
                if (!FSUtils.exists(path))
                    FSUtils.createDirectory(path);
                cb(null, path);
            },
            filename: (req, file, cb) => {
                cb(null, file.originalname);
            }
        });
        this.upload = multer({
            storage: storage
        });
    }


}

export = GalleryInjector;