import {Request} from "express";
import {Response} from "express";
import {Model} from "mongoose";
import QueryUtils = require('../../../utils/QueryUtils');
import NotFound = require("../../../responses/NotFound");
import InternalServerError = require("../../../responses/InternalServerError");
import ModelUtils = require("../../../utils/ModelUtils");
import RequestType = require("../../../utils/ModelUtils");
import OperationType = require("../../../utils/OperationType");
import Logger = require("../../../app/internals/Logger");
import RouterUtils = require("../../../utils/RouterUtils");
var utils = require('../utils');
/**
 * Created by gerard on 13/04/16.
 */
class TypeBased {
    private static logger = Logger.getLogger();

    //TODO: Add hooks and middlewares
    public static directReference(model:Model, field:string, refModel:Model, refField:string) {
        return (req:Request, res:Response)=> {
            TypeBased.runBeforeDatabaseCallbacks(OperationType.GET, model, req, res, ()=> {
                QueryUtils.findOne(OperationType.GET, model, req, (err, doc)=> {
                    TypeBased.rejectIfErrorOrDocumentNotFound(OperationType.GET, model, err, doc, req, res, (doc)=> {
                        var value = doc[refField].toString();
                        QueryUtils.findOneWithValue(OperationType.GET, refModel, req, value, (err, doc)=> {
                            TypeBased.rejectIfErrorOrDocumentNotFound(OperationType.GET, refModel, err, doc, req, res, (doc)=> {
                                res.json(doc);
                                return res.end();
                            });
                        });
                    });
                });
            });
        };
    }

    public static indirectReferenceGet(model:Model, refModel:string, key:string) {
        var gConfig = model.injector();
        var refConfig = refModel.injector();
        return (req:Request, res:Response, next:Function)=> {
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
        }
    }

    public static indirectReferencePost(model:Model, refModel:Model, key:string) {
        var gConfig = model.injector();
        var refConfig = refModel.injector();
        return (req:Request, res:Response)=> {
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
        }
    }


    private static rejectIfErrorOrDocumentNotFound(operation:OperationType, model, err, doc, req, res, cb) {
        if (err) {
            utils.getConfigByProfile(operation, model, req, err);
            TypeBased.logger.error(err);
            utils.runErrorCallbacks(config);
            var error = new InternalServerError();
            res.status(error.getStatusCode());
            res.json(error.toJson());
        } else if (!doc) {
            var error = new NotFound();
            res.status(error.getStatusCode());
            res.json(error.toJson());
        } else {
            cb(doc);
        }
    }

    private static runBeforeDatabaseCallbacks(operation:OperationType, model, req, res, cb) {
        var operationConfig = model.injector()[operation];
        var callbacks = utils.getConfigByProfile(operationConfig, req).pre;
        if (callbacks && callbacks.length) {
            utils.runPreCallbacks(callbacks, model, req, res, cb);
        } else {
            cb();
        }
    }

    private static runErrorCallbacks(operation:OperationType, model, req, err) {
        var operationConfig = model.injector()[operation];
        utils.runErrorCallbacks(operationConfig, req, err);
    }

}
export = TypeBased;