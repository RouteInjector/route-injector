///<reference path='../../../../typings/index.d.ts'/>

import {Request} from "express";
import {Response} from "express";
import {Express} from "express";
import FSUtils = require("../../../utils/FSUtils");
import bodyParser = require("body-parser");
import logger = require('morgan');
import cookieParser = require('cookie-parser');
import RiResponse = require("../../../responses/Response");
import Logger = require("../Logger");
import multer = require("multer");

export function expressSetup(app:Express, viewsPath:string, viewEngine:string) {
    app.set('views', FSUtils.join(viewsPath, 'views'));
    app.set('view engine', viewEngine || 'ejs');

    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    app.use(multer());
    app.use(cookieParser());

}

export function cors() {
    return function (req, res, next) {
        res.header('Access-Control-Allow-Origin', "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control,token,Authorization");
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
        } else {
            return next();
        }
    }
}

export function notFoundHandler() {
    return function (req, res, next) {
        var err:any = {};
        err.status = 404;
        err.message = "404 - Not Found";
        next(err);
    };
}

export function redirectHandler(url:String) {
    return function (req, res, next) {
        res.redirect(url);
    };
}

export function errorHandler() {
    var logger = Logger.getLogger('Express Middlewares - Error Handler');
    return (err:any, req:Request, res:Response, next:Function) => {
        if (err instanceof RiResponse) {
            var castedError = (<RiResponse> err);
            res.status(castedError.getStatusCode());
            res.json(castedError.toJson());
        } else {
            if (err.status == 500)
                logger.error(err);
            res.status(err.status || 500);
            if (res.statusCode == 500) {
                logger.error(err);
            }

            res.json({
                error: err.status,
                message: err.message
            })
        }
        return res.end();
    }
}