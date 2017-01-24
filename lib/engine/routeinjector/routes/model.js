var statusCode = require('statusCode');
var injector = require('../../../');
var jsonform = injector.MongooseJsonform;
var mongooseInjector = injector.MongooseInjector
var mongoose = injector.mongoose;
var Schema = mongoose.Schema;
var _ = require('lodash');
var async = require('async');

module.exports.getModels = function (req, res) {
    var models = Object.keys(injector.models).filter(function (mName) {
        var m = injector.models[mName].injector();
        return (m.visible === undefined || m.visible === true);
    });

    if (!req.user || !req.user.role || (!injector.security.roles || injector.security.roles.length == 0)) {
        res.json(models);
        return res.end();
    }

    var role = req.user.role;
    var result = models.filter(function (modelName) {

        var model = injector.cache.middlewares[modelName];
        var validRoutes = Object.keys(model).filter(function (m) {

            var regex = new RegExp("checkRole\(.*?" + role + ",?.*?\)");
            var middlewareRegex = new RegExp("checkRole");

            var hasMiddleware = middlewareRegex.test(model[m].join('\n'));
            var hasRole = regex.test(model[m].join('\n'));

            return !hasMiddleware || (hasMiddleware && hasRole);
        });

        return validRoutes.length > 0;
    });

    res.json(result);
    res.end();
};

module.exports.getJsonSchema = function (req, res) {
    var modelName = req.params.modelname;
    try {
        var Model = mongoose.model(modelName);
        var doc = new Model({});
        var out = doc.jsonform({});

        res.statusCode = statusCode.OK();
        res.json(out);
        res.end();
    }
    catch (error) {
        res.statusCode = statusCode.InternalServerError();
        injector.log.error(error);
        res.json(error);
        res.end();
    }
};

module.exports.postJsonSchema = function (req, res) {
    var modelName = req.params.modelname;

    try {
        var schema = new Schema(req.body);
        schema.plugin(mongooseInjector, injector);
        schema.plugin(jsonform, {
            excludedPaths: ['_id', '__v'] //these paths are generally excluded
        });
        //Deleted in order to owerwrite
        //http://stackoverflow.com/questions/19643126/how-do-you-remove-a-model-from-mongoose
        delete mongoose.connection.models[modelName];
        var Model = mongoose.model(modelName, schema);
        var doc = new Model({});

        var out = doc.jsonform({});

        res.statusCode = statusCode.OK();
        res.json(out);
        res.end();
    }
    catch (error) {
        res.statusCode = statusCode.InternalServerError();
        injector.log.error(error);
        res.json(error);
        res.end();
    }
};

module.exports.getFormConfig = function (req, res) {
    var modelName = req.params.modelname;
    try {
        var Model = mongoose.model(modelName);
        var minjector = Model.injector();
        var shard = _.clone(minjector.shard, true);
        if (injector.security.permissions.shards) {
            if (!req.user || !req.user.role) {
                res.statusCode = statusCode.Unauthorized();
                res.json("Unauthorized");
                return res.end();
            }

            if (minjector.shard && minjector.shard.shardValues) {
                var restrictions = injector.config.permissions.shards[req.user.role];

                if (restrictions && restrictions.blacklist) {
                    shard.shardValues = _.xor(restrictions.blacklist, minjector.shard.shardValues);
                    shard.filtered = true;
                }

                if (restrictions && restrictions.whitelist) {
                    // Region "$OWN_REGION" is translated to the user own region
                    var list = _.clone(restrictions.whitelist);
                    var match = list.indexOf("$OWN_REGION");
                    if(match != -1) {
                        list[match] = req.user.region;
                    }

                    shard.shardValues = _.intersection(list, minjector.shard.shardValues);
                    shard.filtered = true;
                }
            }
        }

        var form = {
            id: minjector.id,
            displayField: minjector.displayField,
            path: minjector.path,
            plural: minjector.plural,
            isSingle: minjector.isSingle || false,
            hideMenu: minjector.hideMenu || false,
            section: minjector.section || "Models",
            extraDisplayFields: minjector.extraDisplayFields,
            searchableFields: minjector.searchableFields,
            shard: shard,
            get: minjector.get.disable ? false : true,
            post: minjector.post.disable ? false : true,
            put: minjector.put.disable ? false : true,
            delete: minjector.delete.disable ? false : true,
            search: minjector.search.disable ? false : true,
            export: minjector.export.disable ? false : true,
            import: minjector.import.disable ? false : true,
            form: minjector.form,
            graphs: minjector.graphs,
            extraActions: minjector.extraActions,
            defaultSearch: minjector.defaultSearch || {}
        };

        res.statusCode = statusCode.OK();
        res.json(form);
        res.end();
    }
    catch (error) {
        res.statusCode = statusCode.InternalServerError();
        console.error(error);
        res.json(error);
        res.end();
    }
};
