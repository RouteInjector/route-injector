///<reference path='../../../../typings/index.d.ts'/>
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var FSUtils = require("../../../utils/FSUtils");
var bodyParser = require("body-parser");
var logger = require("morgan");
var cookieParser = require("cookie-parser");
var RiResponse = require("../../../responses/Response");
var Logger = require("../Logger");
function expressSetup(app, config) {
    app.set('views', FSUtils.join(config.appPath, 'views'));
    app.set('view engine', config.application.view_engine || 'ejs');
    logger.token('body', function getUrlToken(req) {
        return req.__body || "";
    });
    logger.token('user', function getUser(req) {
        return (req.user ? '"' + req.user[config.auth.login.key] + '"' : "");
    });
    function headersSent(res) {
        return typeof res.headersSent !== 'boolean'
            ? Boolean(res._header)
            : res.headersSent;
    }
    // Avoid Typescript Error TS2339 (Morgan typings lacks format)
    logger.format('ri', function developmentFormatLine(tokens, req, res) {
        // get the status code if response written
        var status = headersSent(res)
            ? res.statusCode
            : undefined;
        // get status color
        var color = status >= 500 ? 31 // red
            : status >= 400 ? 33 // yellow
                : status >= 300 ? 36 // cyan
                    : status >= 200 ? 32 // green
                        : 0; // no color
        // get colored function
        var fn = developmentFormatLine[color];
        if (!fn) {
            // compile
            // Avoid Typescript Error TS2339 (Morgan typings lacks compile)
            fn = developmentFormatLine[color] = logger.compile('\x1b[0m:method :url :body :user \x1b[' +
                color + 'm:status \x1b[0m:response-time ms - :res[content-length]\x1b[0m');
        }
        return fn(tokens, req, res);
    });
    //app.use(logger(':method :url :body :status :response-time ms - :res[content-length]'));
    app.use(logger('ri'));
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
function angularNotFoundHandler(indexPath) {
    return function (req, res, next) {
        res.sendFile('index.html', { root: indexPath });
    };
}
exports.angularNotFoundHandler = angularNotFoundHandler;
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