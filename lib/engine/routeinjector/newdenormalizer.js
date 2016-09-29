var utils = require('./utils');
var Q = require('q');
var _ = require('lodash');
var injector = require('../../');
var async = require('async');
var log = injector.log;
var mongoose = injector.mongoose;

function genDenorm(dest, src, denormalized, confRid, plain, doc, path) {
    if (src) {
        dest = {};
        var target;
        if (plain == true) {
            if (path) {
                target = _.get(doc, path);
            } else {
                target = doc;
            }
        } else {
            target = dest;
        }

        if (denormalized instanceof Array) {//In this case always will be available an id field
            for (var fi in denormalized) {
                var f = denormalized[fi];
                if (typeof(f) == "object") {
                    _.set(target, f.target, _.get(src, f.source, ""));
                } else {
                    _.set(target, f, _.get(src, f, ""));
                }
            }
            if (denormalized.indexOf(confRid) == -1 && !plain) { //ID for the future normalization if needed
                _.set(target, confRid, _.get(src, confRid));
            }
        } else {
            if (typeof(denormalized) == "object") {
                _.set(target, denormalized.target, _.get(src, denormalized.source));
            } else if (denormalized == confRid) { //It is a single standard reference !
                dest = _.get(src, confRid);
            } else {
                dest = _.get(src, denormalized);
            }
        }
        if (plain == true) {
            dest = _.get(src, confRid);
        }
    }
    return dest;
}


function genNorm(dest, src, denormalized, confRid) {
    if (src) {
        dest = src[confRid];
        return dest;
    } else {
        return undefined;
    }
}


module.exports.denormalize = function (field, rkey, Model, isArray, fullPath) {
    var needsFromDBhook = true;
    var denormalizedFields = field.denormalize;
    log.debug("Adding denormalized params :\"" + denormalizedFields + "\" to field " + fullPath + " in model " + Model.modelName);

    var RefModel = mongoose.model(field.ref);
    var refConf = utils.getModels()[RefModel.modelName];

    Model.injector()._references = Model.injector()._references || {};
    Model.injector()._references.fields = Model.injector()._references.fields || {};
    Model.injector()._references.fields[rkey] = Model.injector()._references.fields[rkey] || {};
    Model.injector()._references.fields[rkey].userConfig = {id: refConf.id, shard: refConf.shard};
    Model.injector()._references.fields[rkey].model = RefModel;
    Model.injector()._references.fields[rkey].denormalize = denormalizedFields;
    Model.injector()._references.fields[rkey].fullPathParent = fullPath;
    Model.injector()._references.fields[rkey].isPlain = field.plain;


    if (!(denormalizedFields instanceof Array) && (denormalizedFields == refConf.id)) {//The correct and natural field is stored in Mongo, it does not need any process
        needsFromDBhook = false;
    }

    Model.injector()._references.toDB = function (doc, cb) {
        var defer = Q.defer();
        var self = doc;
        var promises = [];

        async.eachSeries(Object.keys(Model.injector()._references.fields),
            function (referenceKey, seriesCallback) {
                var reference = Model.injector()._references.fields[referenceKey];
                var modelR = reference.model;
                var confR = reference.userConfig;
                var denormalized = reference.denormalize;
                var fullPathParent = reference.fullPathParent;
                var isPlain = reference.isPlain;
                var confS = Model.injector();

                utils.iterate(fullPathParent, self, function (elem, path) {
                    if (elem && JSON.stringify(elem) != "{}") { //TODO: ÑAPA :)
                        var where = {};
                        if (confR.shard && confR.shard.shardKey && confS.shard && confS.shard.shardKey) {
                            where[confR.shard.shardKey] = self[confS.shard.shardKey];
                        }

                        where[confR.id] = elem;
                        promises.push((function (_where, _denormalized, _confRid, _model, _isPlain, _elem, _path) {
                            return function () {
                                var deferer = Q.defer();
                                _model.findOne(_where).lean().exec().then(function (res) {
                                    var s = _path.split('.');
                                    s.splice(s.length - 1, 1);
                                    var denorm = genDenorm(_elem, res, _denormalized, _confRid, _isPlain, self, s.join('.'));
                                    _.set(self, _path, denorm);
                                    deferer.resolve(self);
                                });
                                return deferer.promise;
                            }

                        })(where, denormalized, confR.id, modelR, isPlain, elem, path));
                    }
                }, function () {
                    seriesCallback();
                });

            }, function () {
                if (promises.length > 0) {
                    utils.allSeries(promises).then(end, error);
                } else {
                    end();
                }
            }
        );

        function error(err) {
            log.error(err);
            if (!cb) {
                defer.reject(err);
            }
        }

        function end() {
            if (cb) {
                cb(self);
            } else {
                defer.resolve(self)
            }
        }

        if (!cb) {
            return defer.promise;
        }
    };

    if (field.propagate) {
        RefModel.injector()._references = RefModel.injector()._references || {};
        RefModel.injector()._references.propagations = RefModel.injector()._references.propagations || {};
        RefModel.injector()._references.propagations[Model.modelName] = RefModel.injector()._references.propagations[Model.modelName] || {};
        RefModel.injector()._references.propagations[Model.modelName][rkey] = RefModel.injector()._references.propagations[Model.modelName][rkey] || {};
        RefModel.injector()._references.propagations[Model.modelName][rkey].denormalize = denormalizedFields;

        RefModel.injector()._references.propagate = function (doc) {
            var models = Object.keys(RefModel.injector()._references.propagations);
            var promises = [];

            async.each(models, function (item, cb) {
                    var propagation = RefModel.injector()._references.propagations[item];
                    var M = mongoose.model(item);
                    var Mconf = utils.getModels()[item];

                    var fields = Object.keys(propagation);
                    for (var f in fields) {
                        var query = {};
                        if (propagation.hasOwnProperty(f)) {
                            if (propagation[f].denormalize instanceof Array) {
                                query[rkey + "." + Mconf.id] = doc[Mconf.id];
                            } else {
                                query[rkey] = doc[Mconf.id];
                            }
                        }

                        promises.push((function (_query, _model, _id) {
                            return function () {
                                var deferer = Q.defer();
                                _model.find(_query, function (err, results) {
                                    if (err) {
                                        return log.error(err);
                                    }
                                    async.eachSeries(results, function (i, cb) {
                                            _model.injector()._references.fromDB(i).then(_model.injector()._references.toDB).then(function (todb) {
                                                log.debug("Propagating to", _model.modelName, todb[_id]);
                                                //Work with both mongoose and plain objects
                                                _model.update({_id: todb._id}, todb, {}, function (updateErr, num) {
                                                    cb(updateErr);
                                                });
                                            });
                                        },
                                        function (asyncErr) {
                                            if (asyncErr) {
                                                deferer.reject(asyncErr);
                                            } else {
                                                deferer.resolve();
                                            }
                                        }
                                    );
                                });
                                return deferer.promise;
                            }
                        })(query, M, Mconf.id));
                    }
                    cb();
                },
                function (err) {
                    if (err) return log.error("Error propagating from model", RefModel.modelName, ":", err);

                    if (promises.length > 0) {
                        utils.allSeries(promises).then(end, log.error.bind(log));
                    } else {
                        end();
                    }

                    function end() {
                        log.debug("Propagation from model", RefModel.modelName, "done");
                    }
                }
            );
        };
    }

    if (needsFromDBhook) {
        Model.injector()._references.fromDB = function (doc, cb) {
            var defer = Q.defer();
            var promises = [];
            var doc2 = doc.toObject();

            async.eachSeries(Object.keys(Model.injector()._references.fields),
                function (referenceKey, seriesCallback) {
                    var reference = Model.injector()._references.fields[referenceKey];
                    var modelR = reference.model;
                    var confR = reference.userConfig;
                    var denormalized = reference.denormalize;
                    var fullPathParent = reference.fullPathParent;
                    var isPlain = reference.isPlain;

                    utils.iterate(fullPathParent, doc2, function (elem, path) {
                            if (elem) {
                                var where = {};
                                if (denormalized instanceof Array && !isPlain)
                                    where[confR.id] = elem[confR.id];
                                else if (isPlain)
                                    where[confR.id] = elem;
                                else
                                    where[denormalized] = elem;


                                promises.push((function (_id, _where, _path) {
                                    return function () {
                                        var deferer = Q.defer();
                                        modelR.findOne(_where).exec().then(function (result) {
                                            var norm = genNorm(doc2, result, denormalized, _id);
                                            _.set(doc2, _path, norm);
                                            deferer.resolve(doc2);
                                        });

                                        return deferer.promise;
                                    }

                                })(confR.id, where, path));
                            }
                        },
                        function () {
                            seriesCallback();
                        }
                    );
                }, function () {
                    if (promises.length > 0) {
                        utils.allSeries(promises).then(end, log.error.bind(log));
                    } else {
                        end();
                    }
                }
            );

            function end() {
                if (cb) {
                    cb(doc2);
                } else {
                    defer.resolve(doc2);
                }
            }

            if (!cb) {
                return defer.promise;
            }
        };
    }
};
