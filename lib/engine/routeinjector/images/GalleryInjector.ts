import {IRouteInjector} from "../../../app/interfaces/IRouteInjector";
import Logger = require("../../../app/internals/Logger");


class GalleryInjector {
    static logger = Logger.getLogger();

    private routeInjector: IRouteInjector;
    private galleryConfig: IGalleryConfig = undefined;

    constructor(routeInjector: IRouteInjector) {
        this.routeInjector = routeInjector
        this.galleryConfig = this.routeInjector.config.env.image && this.routeInjector.config.env.image.gallery || undefined;
    }

    public inject() {
        if (!this.galleryConfig) {
            GalleryInjector.logger.debug("GalleryConfig is not found. Not Injecting.");
            return;
        }
        GalleryInjector.logger.debug("GalleryConfig found. Injecting.");
        this.handleGetImagesList();
        this.handlePostImage();
        this.handleGetImage();
        this.handleDeleteImage();
    }

    private handleGetImagesList() {

    }

    private handlePostImage() {

    }

    private handleGetImage() {

    }

    private handleDeleteImage() {

    }
}

export = GalleryInjector;