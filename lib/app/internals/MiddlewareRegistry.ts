///<reference path='../../../typings/index.d.ts'/>

import FSUtils = require("../../utils/FSUtils");
'use strict';
import {IMiddleware} from "../interfaces/IMiddleware";
import Logger = require("./Logger");
import Configurations = require("./Configurations");

class MiddlewareRegistry {
    private static logger = Logger.getLogger(__filename);
    private config:Configurations;
    private customMiddlewareDirs:string[];
    private _middlewares:{[name:string]: IMiddleware} = {};

    constructor(config:Configurations) {
        this.config = config;
        MiddlewareRegistry.logger.trace("Creating MiddlewareRegistry instance");
        config.routes = config.routes || {};
        this.customMiddlewareDirs = config.routes.customMiddlewares || [];
    }

    public static create(config:Configurations) {
        return new MiddlewareRegistry(config);
    }

    forEachMiddleware(callback:(middleware)=>void):void {
        this.customMiddlewareDirs.forEach((dir)=> {
            var absFolder = FSUtils.join(this.config.appPath, dir);
            var files = FSUtils.getFiles(absFolder);
            files.forEach((file)=> {
                var middleware = require(FSUtils.join(absFolder, file));
                callback(middleware.middleware);
            });
        });
    }

    public get(name:string) {
        return this._middlewares[name];
    }

    public get middlewares() {
        return this._middlewares;
    }

}
export = MiddlewareRegistry;