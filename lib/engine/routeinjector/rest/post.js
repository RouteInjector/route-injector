var Q = require('q');
var statusCode = require('http-status-codes');
var utils = require('../utils');

var injector = require('../../../');
var log = injector.log;

module.exports.post = function (Model) {
    return function (req, res) {
        var gConfig = Model.injector();
        var returnField = Model.injector().id;
        var config = utils.getConfigByProfile(gConfig.post, req);
        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainPostFn) : mainPostFn();

        function mainPostFn() {
            var documentDB;
            var newModel = {};
            //Check incoming body has value
            if (req.body != undefined && req.body) {
                var incomingModel;
                incomingModel = req.body;

                //Create the Model object from the json received
                if (Model.injector()._references && Model.injector()._references.toDB) {
                    Model.injector()._references.toDB(incomingModel, msave);
                } else {
                    msave(incomingModel);
                }

                function msave(m) {
                    m = utils.pruneDocument(m);
                    newModel = new Model(m);
                    //TODO: ADD REQUEST IS COMMENT OUT TO KEEP AAAIDA WORKING
                    //newModel.addRequest(req);

                    //Shard key insertion if shard is enabled
                    if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                        if (req.query[gConfig.shard.shardKey] == undefined && newModel[gConfig.shard.shardKey] == undefined) {
                            log.error("Shard key not present in query");
                            res.statusCode = statusCode.BAD_REQUEST;
                            res.json("Shard key not present in query");
                            return res.end();
                        }
                        newModel[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey] || newModel[gConfig.shard.shardKey];
                    }

                    //Insert the Model
                    var promise = newModel.save();
                    var promises = [];
                    if (config.populate) promises.push(populate);
                    promises.push(postCallbacks);
                    promises.push(ok);
                    promises.reduce(Q.when, promise).catch(error);
                }

                function postCallbacks(doc) {
                    var defer = Q.defer();
                    if (config.post) {
                        utils.runPostCallbacks(config, req, res, doc, function () {
                            defer.resolve(doc);
                        });
                    } else {
                        defer.resolve(doc);
                    }

                    return defer.promise;
                }

                function populate(doc) {
                    var defer = Q.defer();

                    var populateArray = config.populate;
                    if (!(populateArray instanceof Array)) defer.reject('populate field in ' + Model.modelName + ' routerInjector configuration should be and array');
                    return defer.promise.then(Model.populate(doc, populateArray));
                }

                function ok(doc) {
                    // Custom json returner based on the field specified by the developer
                    // Return all the json if null or empty is specified
                    res.statusCode = statusCode.CREATED;
                    documentDB = doc;
                    if (returnField != null && returnField != undefined && returnField != "") {
                        var returnJSON = {};

                        returnJSON[returnField] = doc[returnField];
                        res.json(returnJSON);
                    }
                    else {
                        res.json(newModel);
                    }
                    res.end();
                }

                function error(err) {
                    log.error(err);
                    utils.runErrorCallbacks(config, req, err);

                    if (err.name === "ValidationError") {
                        res.statusCode = statusCode.FORBIDDEN;
                    } else if (res.statusCode == statusCode.OK) {
                        res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
                    }

                    res.json(err);
                    return res.end();
                }

                res.on('finish', function () {
                    if (config.postsend)
                        config.postsend.forEach(function (fn) {
                            fn(documentDB, req);
                        });
                });
            }
            else {
                res.statusCode = statusCode.BAD_REQUEST;
                return res.end();
            }
        }
    }
};
