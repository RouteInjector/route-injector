"use strict";
var QueryUtils = require("../../../utils/QueryUtils");
var NotFound = require("../../../responses/NotFound");
var InternalServerError = require("../../../responses/InternalServerError");
var OperationType = require("../../../utils/OperationType");
var Logger = require("../../../app/internals/Logger");
var RouterUtils = require("../../../utils/RouterUtils");
var utils = require('../utils');
/**
 * Created by gerard on 13/04/16.
 */
var TypeBased = (function () {
    function TypeBased() {
    }
    //TODO: Add hooks and middlewares
    TypeBased.directReference = function (model, field, refModel, refField) {
        return function (req, res) {
            TypeBased.runBeforeDatabaseCallbacks(OperationType.GET, model, req, res, function () {
                QueryUtils.findOne(OperationType.GET, model, req, function (err, doc) {
                    TypeBased.rejectIfErrorOrDocumentNotFound(OperationType.GET, model, err, doc, req, res, function (doc) {
                        var value = doc[refField].toString();
                        QueryUtils.findOneWithValue(OperationType.GET, refModel, req, value, function (err, doc) {
                            TypeBased.rejectIfErrorOrDocumentNotFound(OperationType.GET, refModel, err, doc, req, res, function (doc) {
                                res.json(doc);
                                return res.end();
                            });
                        });
                    });
                });
            });
        };
    };
    TypeBased.indirectReferenceGet = function (model, refModel, key) {
        var gConfig = model.injector();
        var refConfig = refModel.injector();
        return function (req, res, next) {
            req.body = {};
            req.body.limit = req.query.limit;
            req.body.skip = req.query.skip;
            req.body.sortBy = req.query.sortBy;
            //if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
            //    req.body[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            //}
            req.method = 'post';
            req.url = '/' + gConfig.plural;
            req.body.query = {};
            req.body.query[key] = req.params[refConfig.id];
            TypeBased.logger.info("Doing an internal redirect to ", model.injector().plural, "search with the following parameters:", req.body);
            RouterUtils.handleInternalRewrite(req, res);
        };
    };
    TypeBased.indirectReferencePost = function (model, refModel, key) {
        var gConfig = model.injector();
        var refConfig = refModel.injector();
        return function (req, res) {
            req.body.limit = req.body.limit || req.query.limit;
            req.body.skip = req.body.skip || req.query.skip;
            req.body.sortBy = req.body.sortBy || req.query.sortBy;
            //if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
            //    req.body[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            //}
            req.method = 'post';
            req.url = '/' + gConfig.plural;
            req.body.query[key] = req.params[refConfig.id];
            TypeBased.logger.info("Doing an internal redirect to ", model.injector().plural, "search with the following parameters:", req.body);
            RouterUtils.handleInternalRewrite(req, res);
        };
    };
    TypeBased.rejectIfErrorOrDocumentNotFound = function (operation, model, err, doc, req, res, cb) {
        if (err) {
            utils.getConfigByProfile(operation, model, req, err);
            TypeBased.logger.error(err);
            utils.runErrorCallbacks(config);
            var error = new InternalServerError();
            res.status(error.getStatusCode());
            res.json(error.toJson());
        }
        else if (!doc) {
            var error = new NotFound();
            res.status(error.getStatusCode());
            res.json(error.toJson());
        }
        else {
            cb(doc);
        }
    };
    TypeBased.runBeforeDatabaseCallbacks = function (operation, model, req, res, cb) {
        var operationConfig = model.injector()[operation];
        var callbacks = utils.getConfigByProfile(operationConfig, req).pre;
        if (callbacks && callbacks.length) {
            utils.runPreCallbacks(callbacks, model, req, res, cb);
        }
        else {
            cb();
        }
    };
    TypeBased.runErrorCallbacks = function (operation, model, req, err) {
        var operationConfig = model.injector()[operation];
        utils.runErrorCallbacks(operationConfig, req, err);
    };
    return TypeBased;
}());
TypeBased.logger = Logger.getLogger();
module.exports = TypeBased;
//# sourceMappingURL=TypeBased.js.map