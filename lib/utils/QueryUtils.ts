/// <reference path='../../typings/index.d.ts'/>
import {Model} from "mongoose";
import {Request} from "express";
import ModelUtils = require("./ModelUtils");
import OperationType = require("./OperationType");
import mongoose = require("mongoose");
let utils = require("../engine/routeinjector/utils");

class QueryUtils {

    //TODO: Add population key if present
    public static findOne(operation: OperationType, model: Model, req: Request, cb: (err, doc) => void) {
        let query = QueryUtils.getQueryGivenModelAndRequest(operation, model, req);
        let projection = QueryUtils.getProjection(operation, model, req);
        QueryUtils.internalFindOne(model, query, projection, cb);
    };

    public static findOneWithValue(operation: OperationType, model: model, req: Req, value: string, cb: (err, doc) => void) {
        let query = QueryUtils.getQueryGivenModelValueAndRequest(operation, model, req, value);
        let projection = QueryUtils.getProjection(operation, model, req);
        console.log(query, projection);
        QueryUtils.internalFindOne(model, query, projection, cb);
    }

    /**
     * Get counts from a Model
     * @param model
     * @param cb
     */
    public static count(model: Model, cb: (err: count) => void) {
        QueryUtils.queriedCount(model, {}, cb);
    }

    /**
     * Get counts from a Model and a given query
     * @param model
     * @param query
     * @param cb
     */
    public static queriedCount(model: Model, query: any, cb: (err: count) => void) {
        model.count(query, cb);
    }

    /**
     * This function creates the query object using the request's profile, shard and value.
     * @param operation
     * @param model
     * @param req
     * @returns {{}}
     */
    private static getQueryGivenModelAndRequest(operation: OperationType, model: Model, req: Request) {
        let gConfig = model.injector();
        let config = utils.getConfigByProfile(gConfig[operation], req);

        let query = {};
        for (let i in config.mongo.query) {
            //COPY the object
            query[i] = config.mongo.query[i];
        }
        //Query with the field defined by the user
        query[gConfig.id] = req.params[gConfig.id];

        //Shard key insertion if shard is enabled
        if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] !== undefined) {
            query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
        }
        return query;
    }

    /**
     * This function creates the query object using request's profile, request's shard (if available) and the given field and value.
     * @param operation
     * @param model
     * @param req
     * @param field
     * @param value
     */
    private static getQueryGivenModelValueAndRequest(operation: OperationType, model: Model, req: Request, value: string) {
        let gConfig = model.injector();
        let config = utils.getConfigByProfile(gConfig[operation], req);

        let query = {};
        for (let i in config.mongo.query) {
            //COPY the object
            query[i] = config.mongo.query[i];
        }
        //Query with the field defined by the user
        query[gConfig.id] = value.toString();

        //Shard key insertion if shard is enabled
        if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] !== undefined) {
            query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
        }
        return query;
    }

    private static getProjection(operation: OperationType, model: Model, req: Request) {
        let gConfig = model.injector();
        let config = utils.getConfigByProfile(gConfig[operation], req);
        return config.mongo.projection;
    }

    private static internalFindOne(model, query, projection, cb: Function) {
        model.findOne(query, projection, cb);
    }


}
export = QueryUtils;
