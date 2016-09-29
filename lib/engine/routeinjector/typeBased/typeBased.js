var utils = require('../utils');
var statusCode = require('statusCode');
var confs = utils.getModels();
var Q = require('q');

var injector = require('../../../');
var log = injector.log;

module.exports.getRefField = function (Model, field, refModel, key) {

    return function (req, res) {
        var gConfig = Model.injector();
        var config = utils.getConfigByProfile(gConfig.get, req);
        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            var query = {};
            for (var i in config.mongo.query) {
                //COPY the object
                query[i] = config.mongo.query[i];
            }
            //Query with the field defined by the user
            query[field] = req.params[field];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            //Get the Model from Mongo
            Model.findOne(query, config.mongo.projection, function (err, result) {
                if (err) {
                    log.error(err);
                    utils.runErrorCallbacks(config, req, err);
                    res.statusCode = statusCode.InternalServerError();
                    res.json(err);
                    return res.end();
                }
                else {
                    if (result == null) {
                        res.statusCode = statusCode.NotFound();
                        res.json("Not found");
                        return res.end();
                    }
                    else { //Success - return the json

                        /*********************************************************/
                        /*********************************************************/
                        /***********************  NEW MODEL  *********************/
                        /*********************************************************/
                        /*********************************************************/
                        var refConf = confs[refModel.modelName];
                        var gConfig = utils.getConfigByProfile(refConf.get, req);
                        var newQuery = {};

                        //Shard key insertion if shard is enabled
                        if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                            newQuery[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }

                        for (var i in gConfig.mongo.query) {
                            newQuery[i] = gConfig.mongo.query[i];
                        }

                        newQuery["_id"] = result[key];
                        //newQuery[refConf.id] = result[key];

                        refModel.findOne(newQuery, gConfig.mongo.projection, function (err, results) {
                            if (err) {
                                res.statusCode = statusCode.InternalServerError();
                                res.json(err);
                                return res.end();
                            }
                            if (results) {
                                res.statusCode = statusCode.OK();
                                res.json(results);
                                return res.end();
                            } else {
                                res.statusCode = statusCode.NotFound();
                                res.json("Not found reference");
                                return res.end();
                            }
                        });
                    }
                }
            });
        }
    }
}

module.exports.getQueriedRefField = function (Model, field, refModel, key) {

    return function (req, res) {
        var gConfig = Model.injector();
        var config = utils.getConfigByProfile(gConfig.get, req);
        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            var query = {};
            for (var i in config.mongo.query) {
                //COPY the object
                query[i] = config.mongo.query[i];
            }
            //Query with the field defined by the user
            query[field] = req.params[field];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            //Get the Model from Mongo
            Model.findOne(query, config.mongo.projection, function (err, result) {
                if (err) {
                    log.error(err);
                    utils.runErrorCallbacks(config, req, err);
                    res.statusCode = statusCode.InternalServerError();
                    res.json(err);
                    return res.end();
                }
                else {
                    if (result == null) {
                        res.statusCode = statusCode.NotFound();
                        res.json("Not found");
                        return res.end();
                    }
                    else { //Success - return the json

                        /*********************************************************/
                        /*********************************************************/
                        /***********************  NEW MODEL  *********************/
                        /*********************************************************/
                        /*********************************************************/
                        var refConf = confs[refModel.modelName];
                        var gConfig = utils.getConfigByProfile(refConf.get, req);
                        var newQuery = {};

                        //Shard key insertion if shard is enabled
                        if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                            newQuery[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }

                        for (var i in gConfig.mongo.query) {
                            newQuery[i] = gConfig.mongo.query[i];
                        }

                        if(req.body && req.body.query)
                            newQuery = req.body.query;

                        var projection = {_id: 1};
                        if (refConf.displayField) {
                            projection[refConf.displayField] = 1;
                        } else {
                            projection[refConf.id] = 1;
                        }

                        refModel.find(newQuery, projection, function (err, results) {
                            if (err) {
                                res.statusCode = statusCode.InternalServerError();
                                res.json(err);
                                return res.end();
                            }
                            if (results) {
                                res.statusCode = statusCode.OK();
                                res.json(results);
                                return res.end();
                            } else {
                                res.statusCode = statusCode.NotFound();
                                res.json("Not found reference");
                                return res.end();
                            }
                        });
                    }
                }
            });
        }
    }
}

module.exports.getInvRefField = function (Model, refModel, field) {
    return function (req, res) {
        var gConfig = Model.injector();
        var config = utils.getConfigByProfile(gConfig.get, req);
        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            var query = {};
            for (var i in config.mongo.query) {
                //COPY the object
                query[i] = config.mongo.query[i];
            }
            //Query with the field defined by the user
            query[gConfig.id] = req.params[gConfig.id];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            //Get the Model from Mongo
            Model.findOne(query, config.mongo.projection, function (err, result) {
                if (err) {
                    log.error(err);
                    utils.runErrorCallbacks(config, req, err);
                    res.statusCode = statusCode.InternalServerError();
                    res.json(err);
                    return res.end();
                }
                else {
                    if (result == null) {
                        res.statusCode = statusCode.NotFound();
                        res.json("Not found");
                        return res.end();
                    }
                    else { //Success - return the json
                        (config.populate) ? utils.dynamicPopulate(config.populate, Model, result, okCallbackTask) : okCallbackTask();

                        function okCallbackTask() {
                            (config.post && config.post.length > 0) ? utils.runPostCallbacks(config, req, res, result, function () {
                                res.end();
                            }) : endOK();
                        }

                        function endOK() {
                            var refConf = confs[refModel.modelName];

                            if (refConf.search.disable === true) {
                                res.statusCode = statusCode.Unauthorized();
                                res.json("Exporting N documents from model " + refModel.modelName + " is not allowed");
                                return res.end();
                            }
                            else {
                                /*********************************************************/
                                /*********************************************************/
                                /***********************  NEW MODEL  *********************/
                                /*********************************************************/
                                /*********************************************************/
                                var gConfig = utils.getConfigByProfile(refConf.search, req);
                                var newQuery = {};

                                //Shard key insertion if shard is enabled
                                if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                                    newQuery[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                                }

                                for (var i in gConfig.mongo.query) {
                                    newQuery[i] = gConfig.mongo.query[i];
                                }

                                newQuery[field] = result["_id"];
                                //newQuery[field] = result[refConf.id];

                                refModel.find(newQuery, gConfig.mongo.projection, function (err, results) {
                                    if (err) {
                                        res.statusCode = statusCode.InternalServerError();
                                        res.json(err);
                                        return res.end();
                                    }
                                    if (results) {
                                        res.statusCode = statusCode.OK();
                                        res.json(results);
                                        return res.end();
                                    } else {
                                        res.statusCode = statusCode.NotFound();
                                        res.json("Not found");
                                        return res.end();
                                    }
                                });
                            }
                        }
                    }
                }
            });
        }
    }
};


/**
 * Deprecated methods
 */

/*module.exports.getAllArray = function (Model, key) {

    return function (req, res) {
        var gConfig = Model.injector();

        var config = utils.getConfigByProfile(gConfig.get, req);

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            var query = {};
            for (var i in config.mongo.query) {
                //COPY the object
                query[i] = config.mongo.query[i];
            }
            //Query with the field defined by the user
            query[gConfig.id] = req.params[gConfig.id];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            var promise = Model.findOne(query, {}).exec();

            var promises = [];
            promises.push(checkDocument);
            promises.push(ok);

            promises.reduce(Q.when, promise).catch(error);

            function checkDocument(doc) {
                if (!doc) {
                    res.statusCode = statusCode.NotFound();
                    throw new Error('Document not found');
                }
                return doc;
            }

            function ok(doc) {
                res.statusCode = statusCode.OK();
                res.json(doc[key]);
                return res.end();
            }

            function error(err) {
                utils.runErrorCallbacks(config, req, err);

                if (res.statsCode == statusCode.OK())
                    res.statusCode = statusCode.InternalServerError();

                res.json(err.message);
                return res.end();
            }
        }
    }
}*/

/*module.exports.getArrayElementAt = function (Model, key) {

    return function (req, res) {
        var gConfig = Model.injector();

        var config = utils.getConfigByProfile(gConfig.get, req);

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetFn) : mainGetFn();

        function mainGetFn() {
            var query = {};
            for (var i in config.mongo.query) {
                //COPY the object
                query[i] = config.mongo.query[i];
            }
            //Query with the field defined by the user
            query[gConfig.id] = req.params[gConfig.id];

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
            }

            var promise = Model.findOne(query, {}).exec();

            var promises = [];
            promises.push(checkDocument);
            promises.push(ok);

            promises.reduce(Q.when, promise).catch(error);

            function checkDocument(doc) {
                if (!doc) {
                    res.statusCode = statusCode.NotFound();
                    throw new Error('Document not found');
                }
                return doc;
            }

            function ok(doc) {
                res.statusCode = statusCode.OK();
                res.json(doc[key][req.params.index]);
                return res.end();
            }

            function error(err) {
                utils.runErrorCallbacks(config, req, err);

                if (res.statsCode == statusCode.OK())
                    res.statusCode = statusCode.InternalServerError();

                res.json(err.message);
                return res.end();
            }
        }
    }
}*/

module.exports.appendArrayElement = function (Model, key) {

    return function (req, res) {
        var gConfig = Model.injector();
        var field = gConfig.id;
        var config = utils.getConfigByProfile(gConfig.put, req);
        mainPutFn();

        function mainPutFn() {
            //Check incoming Model
            if (req.body == undefined || req.body.element == undefined) {
                res.statusCode = statusCode.BadRequest();
                res.json("The body must containt the \"element\" key");
                return res.end();
            }
            else {
                var fieldItem = req.params[field];
                var query = {};
                for (var i in config.mongo.query) {
                    //COPY the object
                    query[i] = config.mongo.query[i];
                }
                query[field] = fieldItem;

                //Shard key insertion if shard is enabled
                if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                    query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                }

                //Check if the Model exists in the database
                var promise = Model.findOne(query).exec();

                var promises = [];
                promises.push(checkDocument);
                promises.push(update);
                promises.push(save);
                promises.push(dispatcher);
                promises.push(ok);

                promises.reduce(Q.when, promise).catch(error);

                function checkDocument(doc) {
                    if (!doc) {
                        res.statusCode = statusCode.NotFound();
                        throw new Error('Document not found');
                    }
                    return doc;
                }

                function update(doc) {
                    doc[key].push(req.body.element);

                    //Shard key insertion if shard is enabled
                    if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                        if (doc[gConfig.shard.shardKey] == undefined) {
                            if (req.query[gConfig.shard.shardKey == undefined]) {
                                log.error("Shard key not present in query");
                                res.statusCode = statusCode.BadRequest();
                                res.json("Shard key not present in query");
                                return res.end();
                            }

                            doc[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }
                    }
                    return doc;
                }

                function save(doc) {
                    doc.save(function (saved) {
                        return saved;
                    });
                }

                function dispatcher(doc) {
                    res.statusCode = statusCode.OK();
                }

                function ok() {
                    res.end();
                }

                function error(err) {
                    if (res.statsCode == statusCode.OK())
                        res.statusCode = statusCode.InternalServerError();

                    res.json(err.message);
                    return res.end();
                }
            }
        }
    }
};

module.exports.postArrayElementAt = function (Model, key) {

    return function (req, res) {
        var gConfig = Model.injector();
        var field = gConfig.id;
        var config = utils.getConfigByProfile(gConfig.put, req);
        mainPutFn();

        function mainPutFn() {
            //Check incoming Model
            if (req.body == undefined || req.body.element == undefined) {
                res.statusCode = statusCode.BadRequest();
                res.json("The body must containt the \"element\" key");
                return res.end();
            }
            else {
                var fieldItem = req.params[field];
                var query = {};
                for (var i in config.mongo.query) {
                    //COPY the object
                    query[i] = config.mongo.query[i];
                }
                query[field] = fieldItem;

                //Shard key insertion if shard is enabled
                if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                    query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                }

                //Check if the Model exists in the database
                var promise = Model.findOne(query).exec();

                var promises = [];
                promises.push(checkDocument);
                promises.push(update);
                promises.push(save);
                promises.push(dispatcher);
                promises.push(ok);

                promises.reduce(Q.when, promise).catch(error);

                function checkDocument(doc) {
                    if (!doc) {
                        res.statusCode = statusCode.NotFound();
                        throw new Error('Document not found');
                    }
                    return doc;
                }

                function update(doc) {
                    doc[key].splice(req.params.index, 0, req.body.element);

                    //Shard key insertion if shard is enabled
                    if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                        if (doc[gConfig.shard.shardKey] == undefined) {
                            if (req.query[gConfig.shard.shardKey == undefined]) {
                                log.error("Shard key not present in query");
                                res.statusCode = statusCode.BadRequest();
                                res.json("Shard key not present in query");
                                return res.end();
                            }

                            doc[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }
                    }
                    return doc;
                }


                function save(doc) {
                    doc.save(function (saved) {
                        return saved;
                    });
                }

                function dispatcher(doc) {
                    res.statusCode = statusCode.OK();
                }

                function ok() {
                    res.end();
                }

                function error(err) {
                    if (res.statsCode == statusCode.OK())
                        res.statusCode = statusCode.InternalServerError();

                    res.json(err.message);
                    return res.end();
                }
            }
        }
    }
};

/*module.exports.putArrayElementAt = function (Model, key) {

    return function (req, res) {
        var gConfig = Model.injector();
        var field = gConfig.id;
        var config = utils.getConfigByProfile(gConfig.put, req);
        mainPutFn();

        function mainPutFn() {
            //Check incoming Model
            if (req.body == undefined || req.body.element == undefined) {
                res.statusCode = statusCode.BadRequest();
                res.json("The body must containt the \"element\" key");
                return res.end();
            }
            else {
                var fieldItem = req.params[field];
                var query = {};
                for (var i in config.mongo.query) {
                    //COPY the object
                    query[i] = config.mongo.query[i];
                }
                query[field] = fieldItem;

                //Shard key insertion if shard is enabled
                if (gConfig.shard && gConfig.shard.shardKey && req.query[gConfig.shard.shardKey] != undefined) {
                    query[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                }

                //Check if the Model exists in the database
                var promise = Model.findOne(query).exec();

                var promises = [];
                promises.push(checkDocument);
                promises.push(update);
                promises.push(save);
                promises.push(dispatcher);
                promises.push(ok);

                promises.reduce(Q.when, promise).catch(error);

                function checkDocument(doc) {
                    if (!doc) {
                        res.statusCode = statusCode.NotFound();
                        throw new Error('Document not found');
                    }
                    return doc;
                }

                function update(doc) {
                    doc[key][req.params.index] = req.body.element;

                    //Shard key insertion if shard is enabled
                    if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                        if (doc[gConfig.shard.shardKey] == undefined) {
                            if (req.query[gConfig.shard.shardKey == undefined]) {
                                log.error("Shard key not present in query");
                                res.statusCode = statusCode.BadRequest();
                                res.json("Shard key not present in query");
                                return res.end();
                            }

                            doc[gConfig.shard.shardKey] = req.query[gConfig.shard.shardKey];
                        }
                    }
                    return doc;
                }


                function save(doc) {
                    doc.save(function (saved) {
                        return saved;
                    });
                }

                function dispatcher(doc) {
                    res.statusCode = statusCode.OK();
                }

                function ok() {
                    res.end();
                }

                function error(err) {
                    if (res.statsCode == statusCode.OK())
                        res.statusCode = statusCode.InternalServerError();

                    res.json(err.message);
                    return res.end();
                }
            }
        }
    }
};*/