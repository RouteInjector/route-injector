var async = require('async');
var statusCode = require('http-status-codes');
var _ = require('lodash');
var Q = require('q');

var defaultMongoQuery = {};
var defaultMongoProjection = {__v: 0};
var defaultMongoOpts = {};

var injector = require('../../');
var log = injector.log;
var models = [];

module.exports.checkSetup = function (Model) {
    var mConf = Model.injector();

    //Limit shards based on the environment!
    if (mConf.shard && mConf.shard.shardValues) {
        var restrictions = injector.config.env.restrictions;

        if (restrictions && restrictions.blacklist && restrictions.blacklist.shards) {
            mConf.shard.shardValues = _.xor(restrictions.blacklist.shards, mConf.shard.shardValues);
        }

        if (restrictions && restrictions.whitelist && restrictions.whitelist.shards) {
            mConf.shard.shardValues = _.intersection(restrictions.whitelist.shards, mConf.shard.shardValues);
        }
    }

    mConf.get = routeConfigurationCheck(mConf.get, "get");
    mConf.post = routeConfigurationCheck(mConf.post, "post");
    mConf.put = routeConfigurationCheck(mConf.put, "put");
    mConf.delete = routeConfigurationCheck(mConf.delete, "delete");
    mConf.search = routeConfigurationCheck(mConf.search, "search");
    mConf.export = routeConfigurationCheck(mConf.export, "export");
    mConf.import = routeConfigurationCheck(mConf.import, "import");
    mConf.import = routeConfigurationCheck(mConf.import, "import");
    mConf.validate = routeConfigurationCheck(mConf.validate, "validate");

    if (!mConf.path) {
        mConf.path = Model.modelName;
        log.warn("Path for model: " + Model.modelName + " is not specified. Using " + mConf.path);
    }

    if (!mConf.plural) {
        mConf.plural = mConf.path + "s";
        log.warn("Plural path for model: " + Model.modelName + " is not specified. Using " + mConf.plural);
    }

    if (!mConf.id) {
        mConf.id = "_id";
        log.warn("Identifier for model: " + Model.modelName + " is not specified. Using " + mConf.id);
    }

    //Mongo configuration checking...
    mongoConfigurationCheck(mConf.get, mConf, "get");
    mongoConfigurationCheck(mConf.post, mConf, "post");
    mongoConfigurationCheck(mConf.put, mConf, "put");
    mongoConfigurationCheck(mConf.delete, mConf, "delete");
    mongoConfigurationCheck(mConf.search, mConf, "search");
    mongoConfigurationCheck(mConf.export, mConf, "export");
    mongoConfigurationCheck(mConf.import, mConf, "import");

    return mConf;
};

module.exports.checkMiddleware = function (config) {
    var middleware = {};

    middleware.get = config.get.middleware || [];
    middleware.post = config.post.middleware || [];
    middleware.put = config.put.middleware || [];
    middleware.delete = config.delete.middleware || [];
    middleware.search = config.search.middleware || [];
    middleware.export = config.export.middleware || [];
    middleware.import = config.import.middleware || [];

    return middleware;
};

module.exports.allSeries = function (promises) {
    return promises.reduce(function (p, promise) {
        return p.then(promise);
    }, Q());
};

module.exports.iterate = function it(fullPath, doc, iterator, callback, parents) {

    var paths = fullPath.split('.');
    parents = parents || [];

    async.eachSeries(paths, function (item, cb) {
        paths.splice(0, 1);
        if (/\[\]/.test(item)) {
            var f = item.replace('[]', '');
            if (doc && doc[f] && doc.hasOwnProperty(f)) { //Prevent to iterate over invalid properties :)
                async.eachSeries(Object.keys(doc[f]), function (i, cbi) {
                    if (paths.length > 0) {
                        if (i == 0) { //TODO: ALEX: Check that this assumption is always correct please. This solves denormalization bug, but I don't know if it can break other things
                            parents.push(f + "[" + i + "]");
                        } else {
                            parents.pop();
                            parents.push(f + "[" + i + "]");
                        }
                        it(paths.join('.'), _.get(doc, f + "[" + i + "]"), iterator, function () {
                            cbi();
                        }, parents);
                    } else {
                        var actualPath = f + "[" + i + "]";
                        var fullPath;
                        if(parents.length>0) {
                            fullPath = parents.join('.') + "." + actualPath;
                        } else {
                            fullPath = actualPath;
                        }
                        iterator(_.get(doc, actualPath), fullPath);
                        cbi();
                    }
                }, function (err) {
                    if (err) log.error(err);

                    parents.splice(parents.length - 1, 1);
                    cb();
                });
            } else {
                parents.splice(parents.length - 1, 1);
                cb();
            }
        } else {
            if (doc && doc.hasOwnProperty(item)) {
                if (paths.length > 0) {
                    parents.push(item);
                    it(paths.join('.'), doc[item], iterator, function () {
                        parents.splice(parents.length - 1, 1);
                        cb();
                    }, parents);
                } else {
                    var actualPath = parents.length > 0 ? parents.join('.') + "." + item : item;
                    iterator(_.get(doc, fullPath), actualPath);
                    cb();
                }
            } else {
                cb();
            }
        }
    }, function (err) {
        if (err) {
            log.error(err);
        }
        callback(err);
    })
};

function routeConfigurationCheck(config, method) {
    var routesRestrictions = injector.config.env.restrictions || {};
    var allowed = true;

    if ((routesRestrictions.blacklist && routesRestrictions.blacklist.routes) || (routesRestrictions.whitelist && routesRestrictions.whitelist.routes)) {
        allowed = (routesRestrictions.whitelist && routesRestrictions.whitelist.routes && routesRestrictions.whitelist.routes.indexOf(method) > -1) ||
            (routesRestrictions.blacklist && routesRestrictions.blacklist.routes && routesRestrictions.blacklist.routes.indexOf(method) == -1);
    }

    var cnf = config || {disable: true};
    cnf.profiles = cnf.profiles || {_default: {}};

    if (!allowed) {
        cnf = {disable: true};
    }

    return cnf;
}

function mongoConfigurationCheck(config, gConfig, method) {
    if (config.profiles == undefined) {
        config.profiles = {};
    }

    for (var profile in config.profiles) {
        var pconfig = config.profiles[profile];
        if (pconfig.mongo == undefined)
            pconfig.mongo = {};

        if (pconfig.mongo.query == undefined)
            pconfig.mongo.query = defaultMongoQuery;

        if (method == "search") {
            if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardValues) {//Sharding requirements
                if (pconfig.mongo.projection) {
                    pconfig.mongo.projection[gConfig.shard.shardKey] = 1;
                }
            }
        }

        if (pconfig.mongo.projection == undefined)
            pconfig.mongo.projection = defaultMongoProjection;

        if (pconfig.mongo.options == undefined)
            pconfig.mongo.options = defaultMongoOpts;
    }
}

module.exports.getElementSchema = function (paths, element) {
    var sc = paths[element];
    if (sc) {
        return sc;
    } else {
        if (element.indexOf('.') > -1) {
            var elems = element.split('.');

            var parentPath;
            for (var i = 0; i < elems.length - 1; i++) {
                if (elems.hasOwnProperty(i)) {
                    var chunk = elems[i];

                    if (parentPath) {
                        parentPath += "." + chunk
                    } else {
                        parentPath = chunk;
                    }

                    var parent = module.exports.getElementSchema(paths, parentPath);
                    if (parent) {
                        var child = element.substring(parentPath.length + 1);
                        return module.exports.getElementSchema(parent.schema.paths, child);
                    }
                }
            }
            return undefined;
        }
    }
};

module.exports.configureForm = function (Model) {
    var inj = Model.injector();
    if (inj.form && inj.form.tabs) {
        for (var t in inj.form.tabs) {
            var tab = inj.form.tabs[t];

            configureItems(tab.items);

        }
        inj.form.rows = undefined;
    } else if (inj.form && inj.form.items) {
        configureItems(inj.form.items);
    }

    function configureItems(items) {
        for (var i in items) {
            var item = items[i];
            if (item instanceof Array) {
                items.splice(i, 1, {
                    type: "section",
                    htmlClass: "row",
                    items: item
                });
            } else if (typeof(item) == "object") {
                var nItem = {};
                _.assign(nItem, item);
                nItem.notitle = nItem.notitle || false;
                nItem.class = nItem.class || "row";

                if (item.items)
                    configureItems(item.items);

                nItem.items = item.items;

                items.splice(i, 1, nItem);
            }
        }
    }
};

////// API ENDPOINTS FUNCTIONS
module.exports.addModel = function (Model) {
    if (!models[Model.modelName])
        models[Model.modelName] = Model.injector();
};

module.exports.getModels = function () {
    return models;
};

module.exports.getConfigByProfile = function (gConfig, req) {
    var profile = req.query.profile || req.headers.profile;
    var config = {};

    if (profile == undefined) {
        config = gConfig.profiles._default;
        if (config == undefined) {
            config = {
                mongo: {
                    query: defaultMongoQuery,
                    projection: defaultMongoProjection,
                    options: defaultMongoOpts
                }
            };
        }
    } else {
        config = gConfig.profiles[profile];
        if (config == undefined) {
            config = gConfig.profiles._default;
            if (config == undefined) {
                config = {
                    mongo: {
                        query: defaultMongoQuery,
                        projection: defaultMongoProjection,
                        options: defaultMongoOpts
                    }
                };
            }
        }
    }
    return config;
};

module.exports.pruneDocument = function (indoc) {
    return prune(indoc);

    function prune(doc) {
        if (doc instanceof Array) {
            var objDoc = {};

            //CAREFUL!!! --> Strictly necessary iterate over the plain object
            //Array objects in mongoose has reserved keys as $set or something else
            if (doc.toObject) {
                objDoc = doc.toObject();
            } else {
                objDoc = doc;
            }

            //If we have array, prune each elemenet
            for (var i in objDoc) {
                if (objDoc.hasOwnProperty(i)) {
                    doc[i] = prune(doc[i]);
                }
            }

            //Filter the array for delete all residual elements (undefined or nulls)
            doc = doc.filter(function (val) {
                if (val == undefined || val == null) {
                    return false;
                } else {
                    if (val.toObject) {
                        return val.toObject() != undefined && val.toObject() != null;
                    } else {
                        return true;
                    }
                }
            });

            if (doc.length == 0) {
                doc = undefined;
            }

        } else if (doc != null && doc != undefined && typeof(doc) == "object" && !(doc instanceof Date)) {
            //If we have an object, and is a mongoose object, work with plain objects (better performance and avoid possible bad lectures)
            if (doc.toObject) {
                var objDoc = doc.toObject();
                if (typeof(objDoc) == "object" && objDoc != null && objDoc != undefined) {
                    if (Object.keys(objDoc).length > 0) {
                        for (var i in objDoc) {
                            if (objDoc.hasOwnProperty(i)) {
                                //Prune all the elements in the object
                                //Although we are working with the plain object, we COPY and PRUNE the original object
                                doc[i] = prune(doc[i]);
                            }
                        }
                    } else {
                        //Empty object with no keys, mark as undefined
                        doc = undefined;
                    }
                } else {
                    if (objDoc == null || objDoc == undefined) {
                        //Null objects marked as undefined
                        doc = undefined;
                    }
                }
            } else {
                if (Object.keys(doc).length > 0) {
                    //Here we work with plain objects (not mongoose ones)
                    for (var i in doc) {
                        if (doc.hasOwnProperty(i)) {
                            //Prune all the elements in the object
                            doc[i] = prune(doc[i]);
                        }
                    }
                } else {
                    //Mark undefined empty objects
                    doc = undefined;
                }
            }
        } else {
            if (doc == null) {
                //Convert nulls to undefineds
                doc = undefined;
            }
        }
        return doc;
    }
};

module.exports.runPreCallbacks = function (preFnArray, Model, req, res, cbk) {
    async.applyEachSeries(preFnArray, Model, req, res, cbk);
};

module.exports.runPostCallbacks = function (config, req, res, value, cbk) {
    if (config.post) {
        async.applyEachSeries(config.post, config, req, res, value, cbk);
    }
};

module.exports.runErrorCallbacks = function (config, req, value) {
    if (config.error) {
        config.error.forEach(function (val) {
            val(config, req, value);
        });
    }
};

module.exports.dynamicPopulate = function (populateArray, Model, result, cb) {

    if (!(populateArray instanceof Array)) throw 'populate field in ' + Model.modelName + ' routerInjector configuration should be an array';

    Model.populate(result, populateArray, cb);
};
