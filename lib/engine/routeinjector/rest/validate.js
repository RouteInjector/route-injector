var Q = require('q');
var statusCode = require('statusCode');
var utils = require('../utils');
var async = require('async');

var injector = require('../../../');
var _ = require('lodash');
var log = injector.log;
var mongoose = injector.mongoose;

module.exports.validate = function (Model) {

    var config = Model.injector();
    var additionalId = (config.id != '_id') ? config.id : undefined;
    var shardKey = (config.shard && config.shard.shardKey) ? config.shard.shardKey : undefined;

    return function (req, res) {

        function validateItem(Model, id, cb) {
            Model.findOne({_id: id}, function (err, r) {
                if (err) {
                    log.error(err);
                    res.statusCode = statusCode.InternalServerError();
                    res.json(err.message);
                    return res.end();
                }
                r.validate(function (err) {
                    if (err) {
                        err.stack = undefined;
                        for (var i in err.errors) {
                            err.errors[i].stack = undefined;
                            err.errors[i].properties = undefined;
                        }
                        var o = {id: id};
                        if(additionalId) {
                            o[additionalId] = r[additionalId];
                        }
                        if(shardKey) {
                            o[shardKey] = r[shardKey];
                        }
                        o.error = err;
                        cb(null, o);
                    } else {
                        cb(null, null);
                    }
                });
            });
        }

        Model.find({}, {id: 1}, function (err, results) {
            if (err) {
                log.error(err);
                res.statusCode = statusCode.InternalServerError();
                res.json(err.message);
                return res.end();
            }

            async.map(results, function (item, cb) {
                validateItem(Model, item.get("_id"), cb);
            }, function (err, results) {
                results = results.filter(function (r) {
                    return r != null;
                });
                res.json({count: results.length, data: results});
                res.end();
            });
        });
    };

};
