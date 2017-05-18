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

export function expressSetup(app:Express, config:any) {

    app.set('views', FSUtils.join(config.appPath, 'views'));
    app.set('view engine', config.application.view_engine || 'ejs');

    logger.token('body', function getUrlToken (req) {
      return (req as any).__body || "";
    });

    logger.token('user', function getUser (req) {
       return (req.user ? '"'+req.user[config.auth.login.key]+'"' : "");
    });

    function headersSent (res) {
        return typeof res.headersSent !== 'boolean'
            ? Boolean(res._header)
            : res.headersSent
    }

    // Avoid Typescript Error TS2339 (Morgan typings lacks format)
    (logger as any).format('ri', function developmentFormatLine (tokens, req, res) {
        // get the status code if response written
        var status = headersSent(res)
            ? res.statusCode
            : undefined

        // get status color
        var color = status >= 500 ? 31 // red
            : status >= 400 ? 33 // yellow
            : status >= 300 ? 36 // cyan
            : status >= 200 ? 32 // green
            : 0 // no color

        // get colored function
        var fn = developmentFormatLine[color]

        if (!fn) {
            // compile
            // Avoid Typescript Error TS2339 (Morgan typings lacks compile)
            fn = developmentFormatLine[color] = (logger as any).compile('\x1b[0m:method :url :body :user \x1b[' +
                color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m')
        }

        return fn(tokens, req, res)
    })

    //app.use(logger(':method :url :body :status :response-time ms - :res[content-length]'));
    app.use(logger('ri'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: false}));
    // TODO: multipart has been broken. Rework with new multer
    // app.use(multer());
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
        let err:any = {};
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

export function angularNotFoundHandler(indexPath) {
    return function (req, res, next) {
        res.sendFile('index.html', { root: indexPath });
    }
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
