var Q = require('q');
var statusCode = require('http-status-codes');
var utils = require('../utils');
var async = require('async');

var injector = require('../../../');
var _ = require('lodash');
var log = injector.log;
var mongoose = injector.mongoose;

module.exports.getByField = function (Model) {

    return function (req, res) {
        var gConfig = Model.injector();
        var isTypeBack = (req.query.type && req.query.type == "back"); //Special for filter normalizations

        var config = utils.getConfigByProfile(gConfig.get, req);
        var documentDb;

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            
            //ID CHECKING
            if(gConfig.id == "_id" && !mongoose.Types.ObjectId.isValid(req.params[gConfig.id])){
                res.statusCode = statusCode.NOT_FOUND;
                res.json("Document not found. Invalid mongoose id");
                return res.end();
            }
            
            var query = {};

            _.assign(query, config.mongo.query);
            //Query with the field defined by the user
            query[gConfig.id] = req.params[gConfig.id];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            var promise = Model.findOne(query, config.mongo.projection).exec();
            var promises = [];
            promises.push(checkDocument);
            
            if(!isTypeBack) {
                promises.push(populate);
            }
            promises.push(processPost);

            promises.reduce(Q.when, promise).catch(error);
            //utils.allSeries(promises).then(processPost, error);

            function checkDocument(doc) {
                if (!doc) {
                    res.statusCode = statusCode.NOT_FOUND;
                    throw new Error('Document not found');
                }
                return doc;
            }

            function populate(doc) {
                if (!config.populate)
                    return doc;

                var populateArray = config.populate;
                if (!(populateArray instanceof Array)) throw 'populate field in ' + Model.modelName + ' routerInjector configuration should be and array';
                return Model.populate(doc, populateArray);
            }

            function processPost(doc){
                if(config.post && config.post.length > 0) {

                    var funcArray = _.clone(config.post);
                    var func = funcArray[0];
                    funcArray[0] = startTask;

                    function startTask(callback) {
                        func(config, req, res, doc, callback);
                    }

                    async.waterfall(funcArray, function (err, _config, _req, _res, _result) {
                        ok(_result);
                    });
                } else {
                    ok(doc);
                }
            }

            function ok(doc) {
                res.statusCode = statusCode.OK;
                documentDb = doc;

                //Create the Model object from the json received
                if (Model.injector()._references && Model.injector()._references.fromDB && isTypeBack) {
                    Model.injector()._references.fromDB(doc, msend);
                } else {
                    msend(doc);
                }

                function msend(sdoc) {
                    res.json(sdoc);
                    return res.end();
                }
            }

            function error(err) {
                log.error(err);
                utils.runErrorCallbacks(config, req, err);

                if (res.statusCode == statusCode.OK)
                    res.statusCode = statusCode.INTERNAL_SERVER_ERROR;

                res.json(err.message);
                return res.end();
            }

            res.on('finish', function () {
                if (config.postsend)
                    config.postsend.forEach(function(fn) {
                        fn(documentDb, req);
                    });
                log.debug("PostDB finished");
            });
        }
    }
};