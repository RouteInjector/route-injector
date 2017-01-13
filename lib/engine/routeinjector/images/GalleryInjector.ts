import {IInternalRouteInjector} from "../../../app/interfaces/IRouteInjector";
import Logger = require("../../../app/internals/Logger");
import FSUtils = require("../../../utils/FSUtils");


class GalleryInjector {
    static logger = Logger.getLogger();

    private routeInjector: IInternalRouteInjector;
    private galleryConfig: IGalleryConfig;

    private galleryEndpoint: String;
    private galleryFilepath: String;

    constructor(routeInjector: IInternalRouteInjector) {
        this.routeInjector = routeInjector;
        this.galleryConfig = this.routeInjector.config.env.images && this.routeInjector.config.env.images.gallery || undefined;
    }

    public inject() {
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
    }

    private createFilepathIfNotExist() {
        if (FSUtils.exists(this.galleryFilepath))
            return;
        GalleryInjector.logger.debug("[ GalleryInjector ] -> Creating filepath", this.galleryFilepath);
        FSUtils.createDirectory(this.galleryFilepath)
    }

    private handleGetImagesList() {
        this.routeInjector.app.get(this.galleryEndpoint + "/:path(*)", (req, res) => {
            var path = FSUtils.join(this.galleryFilepath, req.params.path);
            var expression = "*/";
            var dirprefix = "";
            GalleryInjector.logger.debug("[ GalleryInjector ] -> HandleGetImagesList ->",path);
            var files = FSUtils.getClassifiedFileMap(path);
            res.json(files);
            res.end();
        });
    }

    private handlePostImage() {
        this.routeInjector.app.post(this.galleryEndpoint, (req, res) => {

        });
    }

    private handleGetImage() {
        var express = this.routeInjector.internals.express;
        this.routeInjector.app.use(this.galleryEndpoint, express.static(this.galleryFilepath))
    }

    private handleDeleteImage() {
        this.routeInjector.app.delete(this.galleryEndpoint, (req, res) => {

        });
    }

    public static create(routeInjector: IInternalRouteInjector): GalleryInjector {
        return new GalleryInjector(routeInjector);
    }
}

export = GalleryInjector;