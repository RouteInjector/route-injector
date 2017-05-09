var Q = require('q');
var statusCode = require('statusCode');
var utils = require('../utils');
var async = require('async');
var _ = require('lodash');

var injector = require('../../../');
var log = injector.log;
var perm_conf = injector.security.permissions;

var ObjectId = require('mongoose').Types.ObjectId;

module.exports.getNDocumentsPost = function (Model) {

    return function (req, res) {
        if (!req.body) req.body = {};
        if (!req.body.query) req.body.query = {};

        // Stores query JSON for logging in morgan
        req.__body = JSON.stringify(req.body);

        var gConfig = Model.injector();
        var config = utils.getConfigByProfile(gConfig.search, req);
        var isTypeBack = (req.query.type && req.query.type == "back");//Special for filter normalizations

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetNPostFn) : mainGetNPostFn();

        function mainGetNPostFn() {
            var query = req.body.query;

            function validateOID(q) {
                _.forOwn(q, function (value, key) {
                    try {
                        if (/^[a-fA-F0-9]{24}$/.test(value)) {
                            _.set(q, key, new ObjectId(value));
                        } else if (value instanceof Array) {
                            _.forEach(value, function (v) {
                                validateOID(v);
                            });
                        }
                    } catch (e) {
                        log.error(e);
                    }
                });
            }

            validateOID(query);

            var options = {};
            _.assign(options, config.mongo.options);

            var skip = Number(req.query.skip) || Number(req.body.skip) || options.skip;
            var limit = Number(req.query.limit) || Number(req.body.limit) || options.limit;

            options.skip = skip;
            options.limit = limit;

            function checkOverrideHardlimit() {
                if(!req.user) return false;
                return req.user.role == perm_conf.adminRole;
            }

            //Keep a hard-limit for the total items returned unless you are the adminRole
            var hardLimit = perm_conf.hardLimit || 50;
            if((!options.limit || options.limit > hardLimit) && !checkOverrideHardlimit()) {
                options.limit = hardLimit;
            }

            options.sort = req.query.sortBy || req.body.sortBy || options.sort;

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                var shard = req.query[gConfig.shard.shardKey] || req.body[gConfig.shard.shardKey];
                if (shard) {
                    query[gConfig.shard.shardKey] = shard;
                }
            }

            var wcount = {};
            if (gConfig.shard && gConfig.shard.shardKey && query[gConfig.shard.shardKey]) {
                wcount[gConfig.shard.shardKey] = query[gConfig.shard.shardKey];
            }

            Model.count(wcount, function (err, totalCount) {
                if (err) {
                    log.error(err);
                    utils.runErrorCallbacks(config, req, err);
                    res.statusCode = statusCode.InternalServerError();
                    res.json(err);
                    return res.end();
                }
                else {
                    var queryCount = query;
                    if (queryCount.skip) {
                        delete queryCount.skip;
                    }
                    if (queryCount.limit) {
                        delete queryCount.limit;
                    }

                    Model.count(queryCount).exec(function (err, searchCount) {

                        if (err) {
                            log.error(err);
                            utils.runErrorCallbacks(config, req, err);
                            res.statusCode = statusCode.InternalServerError();
                            res.json(err);
                            return res.end();
                        }

                        // This deletes the limit in the query because when post middleware is executed, all the results
                        // are queried and the skip/limit is done at the end. probably not the most intelligent way to do it
                        if (config.post && config.post.length > 0) {
                            delete options.limit;
                        }

                        // TODO: In order to add a restriction in this case the body and the config JSON should be merged.
                        Model.find(query, config.mongo.projection, options, function (err, result) {
                            if (err) {
                                log.error(err);
                                res.statusCode = statusCode.InternalServerError();
                                return res.end();
                            }

                            (config.populate) ? utils.dynamicPopulate(config.populate, Model, result, okCallbackTask) : okCallbackTask();

                            function okCallbackTask() {
                                if (config.post && config.post.length > 0) {
                                    var funcArray = _.clone(config.post);
                                    var func = funcArray[0];
                                    funcArray[0] = startTask;

                                    function startTask(callback) {
                                        func(config, req, res, result, callback);
                                    }

                                    async.waterfall(funcArray, function (err, _config, _req, _res, _result) {
                                        searchCount = _result.length;
                                        if (limit) {
                                            limit = (limit > _result.length || limit < 1) ? _result.length : limit;
                                            _result = _result.slice(0, limit);
                                        }
                                        endOK(_result);
                                    });
                                } else {
                                    endOK(result);
                                }
                            }

                            function endOK(_result) {
                                res.statusCode = statusCode.OK();
                                var sendObj = {};
                                sendObj.status = {};
                                sendObj.status.count = totalCount;
                                sendObj.status.search_count = searchCount;
                                sendObj.result = _result;

                                if (Model.injector()._references && Model.injector()._references.fromDB && isTypeBack) {
                                    async.map(sendObj.result, function (item, _cb) {
                                        Model.injector()._references.fromDB(item, function (m) {
                                            _cb(null, m);
                                        });
                                    }, function (err, mapped) {
                                        if (err) {
                                            log.error(err);
                                            res.statusCode = statusCode.InternalServerError();
                                            res.json(err);
                                            return res.end();
                                        }
                                        sendObj.result = mapped;
                                        res.json(sendObj);
                                        return res.end();
                                    });
                                } else {
                                    res.json(sendObj);
                                    return res.end();
                                }
                            }
                        });
                    });
                }
            });
        }
    }
};

module.exports.getNDocuments = function (Model) {
    var gConfig = Model.injector();
    return function (req, res) {
        req.body = {};
        req.body.limit = req.query.limit;
        req.body.skip = req.query.skip;
        req.body.sortBy = req.query.sortBy;

        if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
            req.body[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
        }

        req.body.query = {};
        return module.exports.getNDocumentsPost(Model)(req, res);
    };
};
