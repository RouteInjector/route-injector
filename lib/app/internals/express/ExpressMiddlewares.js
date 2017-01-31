///<reference path='../../../../typings/index.d.ts'/>
"use strict";
var FSUtils = require("../../../utils/FSUtils");
var bodyParser = require("body-parser");
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var RiResponse = require("../../../responses/Response");
var Logger = require("../Logger");
function expressSetup(app, viewsPath, viewEngine) {
    app.set('views', FSUtils.join(viewsPath, 'views'));
    app.set('view engine', viewEngine || 'ejs');
    app.use(logger('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    // TODO: multipart has been broken. Rework with new multer
    // app.use(multer());
    app.use(cookieParser());
}
exports.expressSetup = expressSetup;
function cors() {
    return function (req, res, next) {
        res.header('Access-Control-Allow-Origin', "*");
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "X-Requested-With,Content-Type,Cache-Control,token,Authorization");
        if (req.method === 'OPTIONS') {
            res.statusCode = 204;
            return res.end();
        }
        else {
            return next();
        }
    };
}
exports.cors = cors;
function notFoundHandler() {
    return function (req, res, next) {
        var err = {};
        err.status = 404;
        err.message = "404 - Not Found";
        next(err);
    };
}
exports.notFoundHandler = notFoundHandler;
function redirectHandler(url) {
    return function (req, res, next) {
        res.redirect(url);
    };
}
exports.redirectHandler = redirectHandler;
function errorHandler() {
    var logger = Logger.getLogger('Express Middlewares - Error Handler');
    return function (err, req, res, next) {
        if (err instanceof RiResponse) {
            var castedError = err;
            res.status(castedError.getStatusCode());
            res.json(castedError.toJson());
        }
        else {
            if (err.status == 500)
                logger.error(err);
            res.status(err.status || 500);
            if (res.statusCode == 500) {
                logger.error(err);
            }
            res.json({
                error: err.status,
                message: err.message
            });
        }
        return res.end();
    };
}
exports.errorHandler = errorHandler;
//# sourceMappingURL=ExpressMiddlewares.js.map