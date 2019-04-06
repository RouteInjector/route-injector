var Q = require('q');
var statusCode = require('http-status-codes');
var utils = require('../utils');
var _ = require('lodash');
var injector = require('../../../');
var async = require("async");
var log = injector.log;
var mongoose = injector.mongoose;

module.exports.putByField = function (Model) {
    var documentDb = {};
    var originalDoc = {};
    return function (req, res) {
        var gConfig = Model.injector();
        var field = gConfig.id;
        var config = utils.getConfigByProfile(gConfig.put, req);

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainPutFn) : mainPutFn();

        function mainPutFn() {
            //ID CHECKING
            if (gConfig.id == "_id" && !mongoose.Types.ObjectId.isValid(req.params[gConfig.id])) {
                res.statusCode = statusCode.NOT_FOUND;
                res.json("Document not found. Invalid mongoose id");
                return res.end();
            }

            var incomingModel = req.body;

            //Check incoming Model
            if (incomingModel == undefined) {
                res.statusCode = statusCode.BAD_REQUEST;
                return res.end();
            }
            else {
                var fieldItem = req.params[field];
                var query = {};
                _.assign(query, config.mongo.query);
                query[field] = fieldItem;

                //Shard key insertion if shard is enabled
                if (gConfig.shard && gConfig.shard.shardKey && incomingModel[gConfig.shard.shardKey] != undefined) {
                    query[gConfig.shard.shardKey] = incomingModel[gConfig.shard.shardKey];
                }

                //Check if the Model exists in the database
                var promise = Model.findOne(query, {__v: 0}).exec();
                var promises = [];
                promises.push(checkDocument);
                if (Model.injector()._references && Model.injector()._references.fromDB) {
                    promises.push(deReference);
                }
                promises.push(update);
                promises.push(postCallbacks);
                promises.push(save);
                promises.push(dispatcher);
                promises.push(ok);
                promises.reduce(Q.when, promise).catch(error);
                //utils.allSeries(promises).then(ok, error);


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

                function deReference(doc) {
                    //Create the Model object from the json received
                    return Model.injector()._references.fromDB(doc);
                }

                function checkDocument(doc) {
                    var defer = Q.defer();
                    if (!doc) {
                        res.statusCode = statusCode.NOT_FOUND;
                        defer.reject('Document not found');
                    } else {
                        defer.resolve(doc);
                    }
                    return defer.promise;
                }

                function update(doc) {
                    //TODO Alex, plis mira esta ñapa que he puesto, en las recetas viene un JSON plano y en los users viene un documento :?
                    if (doc.toObject) {
                        originalDoc = doc.toObject();
                    } else {
                        originalDoc = _.clone(doc, true);
                    }
                    _.assign(doc, incomingModel);

                    //Shard key insertion if shard is enabled
                    if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                        if (doc[gConfig.shard.shardKey] == undefined) {
                            if (req.query[gConfig.shard.shardKey == undefined]) {
                                log.error("Shard key not present in query");
                                res.statusCode = statusCode.BAD_REQUEST;
                                res.json("Shard key not present in query");
                                return res.end();
                            }
                            doc[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }
                    }
                    return doc;
                }

                function save(doc) {
                    var defer = Q.defer();
                    //Create the Model object from the json received
                    if (Model.injector()._references) {
                        if (Model.injector()._references.toDB) {
                            return Model.injector()._references.toDB(doc).then(doUpdate);
                        }
                        else {//After a hook, doc is a javascript object. doUpdate() converts it to a mongo schema
                            return doUpdate(doc);
                        }
                    } else {
                        return doUpdate(doc);
                    }

                    function doUpdate(sdoc) {
                        var query = {_id: sdoc._id};

                        if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "" && sdoc[gConfig.shard.shardKey]) {
                            query[gConfig.shard.shardKey] = sdoc[gConfig.shard.shardKey];
                        }

                        log.debug("QUERY ", JSON.stringify(query));
                        Model.findOne(query, {__v: 0}, function (err, doc) {
                            log.debug("VERSION | DOC", doc.__v, "SDOC", sdoc.__v);
                            //Add to sdoc, then assing will copy its reference to doc. Coping to doc before or after assign will not work properly
                            //TODO: ADD REQUEST IS COMMENT OUT TO KEEP AAAIDA WORKING
                            //if (sdoc.addRequest) {
                            //    sdoc.addRequest(req);
                            //} else {
                            //    doc.addRequest(req);
                            //}
                            _.assign(doc, sdoc);
                            delete doc.__v;
                            utils.pruneDocument(doc);
                            doc.save(function (err) {
                                if (err) {
                                    defer.reject(err);
                                } else {
                                    defer.resolve(doc);
                                }
                            });
                            documentDb = doc;

                        });
                        return defer.promise;
                    }
                }

                function dispatcher(doc) {
                    if (doc) {
                        documentDb = doc;
                    }
                    //RETURN BACK THE ID MODIFIED
                    var returnJSON = {};
                    returnJSON[field] = fieldItem;
                    res.json(returnJSON);
                    res.statusCode = statusCode.OK;
                }

                function ok() {
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
                            fn(documentDb, originalDoc, req);
                        });

                    if (Model.injector()._references && Model.injector()._references.propagate) {
                        Model.injector()._references.propagate(documentDb);
                    }
                });
            }
        }
    }

};
