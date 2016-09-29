'use strict';

module.exports.profileEnum = function (swagger, config, params) {
    var profiles = [];
    for (var tag in config.profiles) {
        profiles.push(tag);
    }

    params.push(swagger.queryParam("profile", "Profile", "string", true, profiles, '_default'));
};

module.exports.shardingEnum = function (swagger, config, params) {
    var shards = [];
    if (config.shard && config.shard.shardKey && config.shard.shardValues) {
        for (var shard in config.shard.shardValues) {
            shards.push(config.shard.shardValues[shard]);
        }
        params.push(swagger.queryParam(config.shard.shardKey, "shardKey: " + config.shard.shardKey, "string", true, shards, shards[0]));
    }
};

module.exports.completeParams = function (swagger, gConfig, routeConfig, params) {
    this.shardingEnum(swagger, gConfig, params);
    this.profileEnum(swagger, routeConfig, params);
};

module.exports.getPath = function (path) {
    return path.split(':')[0].split('/')[1];
};

module.exports.getSwaggerPath = function (path) {
    return path.replace(/[^/]*:([^/]*)+/g, function (s, m) {
        return '{' + m + '}';
    });
}

module.exports.generateModelDefinition = function (Model) {
    var doc = new Model();
    var definition = {};
    definition.id = Model.modelName;
    definition.properties = doc.jsonform();
    return definition;
};

module.exports.addQueryParams = function (route, params) {
    if (route.callbacks) {
        async.forEach(route.callbacks, function (callback) {
            var matches = String(callback).match(/req\.query\.(?:\w+)/g);
            if (matches) {
                async.forEach(matches, function (match) {
                    match = match.split('\.');
                    params.push(swagger.queryParam(match[match.length - 1], "Query param to be used by the function", "string"));
                });
            }
        });
    }
};

module.exports.specGenerator = function (Model, route, params) {
    var ids = "";
    for (var elem in params) {
        if (params[elem].paramType == 'path') {
            ids += params[elem].name + " ";
        }
    }

    var spec = {
        'spec': {
            "description": "Operations about " + Model.modelName,
            "path": module.exports.getSwaggerPath(route['path']),
            "notes": "Returns a " + Model.modelName + ((ids) ? " based on " + ids : ""),
            "summary": "Find " + Model.modelName + ((ids) ? " by " + ids : ""),
            "parameters": params,
            "type": Model.modelName,
            //"response": out,
            //"errorResponses" : [swagger.errors.invalid('id'), swagger.errors.notFound('pet')],
            "nickname": Model.modelName
        }
    };
    return spec;
};