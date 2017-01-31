"use strict";
var utils = require("../engine/routeinjector/utils");
var QueryUtils = (function () {
    function QueryUtils() {
    }
    //TODO: Add population key if present
    QueryUtils.findOne = function (operation, model, req, cb) {
        var query = QueryUtils.getQueryGivenModelAndRequest(operation, model, req);
        var projection = QueryUtils.getProjection(operation, model, req);
        QueryUtils.internalFindOne(model, query, projection, cb);
    };
    ;
    QueryUtils.findOneWithValue = function (operation, model, req, value, cb) {
        var query = QueryUtils.getQueryGivenModelValueAndRequest(operation, model, req, value);
        var projection = QueryUtils.getProjection(operation, model, req);
        console.log(query, projection);
        QueryUtils.internalFindOne(model, query, projection, cb);
    };
    /**
     * Get counts from a Model
     * @param model
     * @param cb
     */
    QueryUtils.count = function (model, cb) {
        QueryUtils.queriedCount(model, {}, cb);
    };
    /**
     * Get counts from a Model and a given query
     * @param model
     * @param query
     * @param cb
     */
    QueryUtils.queriedCount = function (model, query, cb) {
        model.count(query, cb);
    };
    /**
     * This function creates the query object using the request's profile, shard and value.
     * @param operation
     * @param model
     * @param req
     * @returns {{}}
     */
    QueryUtils.getQueryGivenModelAndRequest = function (operation, model, req) {
        var gConfig = model.injector();
        var config = utils.getConfigByProfile(gConfig[operation], req);
        var query = {};
        for (var i in config.mongo.query) {
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
    };
    /**
     * This function creates the query object using request's profile, request's shard (if available) and the given field and value.
     * @param operation
     * @param model
     * @param req
     * @param field
     * @param value
     */
    QueryUtils.getQueryGivenModelValueAndRequest = function (operation, model, req, value) {
        var gConfig = model.injector();
        var config = utils.getConfigByProfile(gConfig[operation], req);
        var query = {};
        for (var i in config.mongo.query) {
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
    };
    QueryUtils.getProjection = function (operation, model, req) {
        var gConfig = model.injector();
        var config = utils.getConfigByProfile(gConfig[operation], req);
        return config.mongo.projection;
    };
    QueryUtils.internalFindOne = function (model, query, projection, cb) {
        model.findOne(query, projection, cb);
    };
    return QueryUtils;
}());
module.exports = QueryUtils;
//# sourceMappingURL=QueryUtils.js.map