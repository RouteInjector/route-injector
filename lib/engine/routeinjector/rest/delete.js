var Q = require('q');
var statusCode = require('statusCode');
var utils = require('../utils');
var _ = require('lodash');
var injector = require('../../../');
var log = injector.log;
var mongoose = injector.mongoose;

module.exports.deleteByField = function (Model) {
    return function (req, res) {
        var gConfig = Model.injector();
        var field = gConfig.id;
        var config = utils.getConfigByProfile(gConfig.delete, req);
        var isTypeRaw = (req.query.type && req.query.type == "raw");//Special for backoffice
        var documentDb;

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainDeleteFn) : mainDeleteFn();

        function mainDeleteFn() {
            //ID CHECKING
            if (gConfig.id == "_id" && !mongoose.Types.ObjectId.isValid(req.params[gConfig.id]) && !isTypeRaw) {
                res.statusCode = statusCode.NotFound();
                res.json("Document not found. Invalid mongoose id");
                return res.end();
            }

            var fieldItem = req.params[field];
            var query = {};
            _.assign(query, config.mongo.query);
            query[field] = fieldItem;

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && gConfig.shardKey != "" && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            var promise;
            if (isTypeRaw) {
                promise = Model.findOne({_id: fieldItem}, {}).lean().exec();
            } else {
                promise = Model.findOne(query, config.mongo.projection).lean().exec();
            }
            var promises = [];
            promises.push(check);
            promises.push(remove);
            promises.push(dispatcher);
            promises = promises.concat(config.post);
            promises.push(ok);

            promises.reduce(Q.when, promise).catch(error);

            function check(doc) {
                var defer = Q.defer();
                if (!doc) {
                    res.statusCode = statusCode.NotFound();
                    defer.reject('Document not found');
                } else {
                    defer.resolve(doc);
                }
                return defer.promise;
            }

            function remove(doc) {
                //return Model.remove({_id: doc._id}).exec();
                var defer = Q.defer();
                Model.findOne({_id: doc._id}, function (err, doc) {
                    if (err) {
                        res.statusCode = statusCode.InternalServerError();
                        defer.reject('Internal server error');
                    } else if (!doc) {
                        res.statusCode = statusCode.NotFound();
                        defer.reject('Document not found');
                    } else {
                        doc.remove(function (err, doc) {
                            if (err) {
                                res.statusCode = statusCode.InternalServerError();
                                defer.reject('Internal server error');
                            } else if (!doc) {
                                res.statusCode = statusCode.NotFound();
                                defer.reject('Document not found');
                            } else {
                                defer.resolve(doc);
                            }
                        });
                    }
                });

                return defer.promise;
            }

            function error(err) {
                log.error(err);
                utils.runErrorCallbacks(config, req, err);
                if (res.statsCode == statusCode.OK()) {
                    res.statusCode = statusCode.InternalServerError();
                }
                res.json(err.message);
                return res.end();
            }

            function dispatcher(doc) {
                if (!doc)
                    res.statusCode = statusCode.NotFound();
                else
                    res.statusCode = statusCode.NoContent();
                return doc;
            }

            function ok(doc) {
                documentDb = doc;
                return res.end();
            }

            res.on('finish', function () {
                if (config.postsend)
                    config.postsend.forEach(function (fn) {
                        fn(documentDb, req);
                    });
                log.debug("PostDB finished");
            });
        }
    }
};
