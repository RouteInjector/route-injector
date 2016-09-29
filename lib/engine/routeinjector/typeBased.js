var refs = require('./typeBased/typeBased');
var utils = require('./utils');
var images = require('./images/image-injector');


var newImages = require('./images/new-image-injector');

var files = require('./files/file-injector');
var async = require('async');
var Q = require('q');
var changeCase = require('change-case');

var denormalizer = require('./newdenormalizer');

var injector = require('../../');
var mongoose = injector.mongoose;
var log = injector.log;

var selector = require('./graphs/selector');

var getElementSchema = utils.getElementSchema;

var typeBased = require('./newTypeBased/TypeBased');
module.exports = function (app) {
    return function () {
        var models = utils.getModels();
        for (var pos in models) {
            var Model = mongoose.model(pos);

            var doc = new Model({});
            var out = doc.jsonform({});

            walkSchema(app, Model, out, "");
            injectGraphs(app, Model);
        }
    }
};

function injectGraphs(app, Model) {
    var conf = utils.getModels()[Model.modelName];
    var graphsConfig = conf.graphs;

    if (graphsConfig)
        app.post(injector.config.routes.prefix + "/" + conf.path + "/graphs/:id", selector.select(Model));

    /*for (var i in conf.graphs) {
     var graph = conf.graphs[i];


     if (graph.type == "punchcard") {
     log.debug("Inject punchcard graph route to model", Model.modelName);
     app.post(injector.config.routes.prefix + "/" + conf.path + "/graphs/" + encodeURI(graph.title), punchgraph.punchgraph(Model, graph));
     }

     if (graph.type == "geograph") {
     log.debug("Inject geograph graph route to model", Model.modelName);
     app.post(injector.config.routes.prefix + "/" + conf.path + "/graphs/" + encodeURI(graph.title), geograph.geograph(Model, graph));
     }

     if (graph.type == "bargraph") {
     log.debug("Inject bargraph graph route to model", Model.modelName);
     app.post(injector.config.routes.prefix + "/" + conf.path + "/graphs/" + encodeURI(graph.title), bargraph.bargraph(Model, graph));
     }
     }*/
}

function transform(Model, key, fullKey, modelConfig, field) {
    /*var sc = getElementSchema(Model.schema.paths, fullKey);
     if(sc){
     sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
     sc.options["x-schema-form"]["disableSuccessState"] = true;
     }*/

    if (fullKey == modelConfig.id) {
        //set unique index
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            //Here we should unregister and register the model again (only for set the unique index to true
            sc.options.unique = true;
        }
    }

    //Enable pretty title if possible
    if (!field.title) {
        var sentenceCased = changeCase.sentenceCase(key);
        var titleCased = changeCase.titleCase(sentenceCased);
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options.title = titleCased;
        }
    }

    if (field.class) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["htmlClass"] = field.class;
        }
    }

    if (field.fieldClass) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["fieldHtmlClass"] = field.fieldClass;
        }
    }

    if (field.labelClass) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["labelHtmlClass"] = field.labelClass;
        }
    }

    if (field.placeholder) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["placeholder"] = field.placeholder;
        }
    }

    if (field.notitle) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["notitle"] = field.notitle;
        }
    }

    if (field.feedback != undefined) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["feedback"] = field.feedback;
        }
    }

    if (field.validationMessage != undefined) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options["x-schema-form"] = sc.options["x-schema-form"] || {};
            sc.options["x-schema-form"]["feedback"] = field.feedback;
        }
    }

    if (field.map != undefined) {
        var sc = getElementSchema(Model.schema.paths, fullKey);
        if (sc) {
            sc.options.enum = Object.keys(field.map);
        }
    }

    //Fix dependsOn configurations
    if (field.dependsOn) {
        if (!field.dependsOn.params) {
            var sc = getElementSchema(Model.schema.paths, fullKey);
            if (sc) {
                var params = [];
                params.push(sc.options.dependsOn.field);
                sc.options.dependsOn.params = params;
            }
        } else if (!(field.dependsOn.params instanceof Array)) {
            var sc = getElementSchema(Model.schema.paths, fullKey);
            if (sc) {
                var params = [];
                params.push(sc.options.dependsOn.params);
                sc.options.dependsOn.params = params;
            }
        }
    }
}

function walkSchema(app, Model, schema, parentName, fromArray, rawPath) {
    var modelConfig = utils.getModels()[Model.modelName];
    for (var key in schema) {
        var field = schema[key];

        var fullKey = (parentName == "" || parentName == undefined) ? key : (parentName + "." + key);


        var absolutePath = rawPath ? rawPath + "." + key : key;
        if (field.type == "array")
            absolutePath += "[]";

        transform(Model, key, fullKey, modelConfig, field);

        if (field.ref) {
            try {
                var refModel = mongoose.model(field.ref);
            } catch (e) {
                var exception = "Exception in Model: " + Model.modelName + ". In the field: " + key + " which has a reference to: " + field.ref + "\n\n Original raised exception: " + e + "\n\n";
                throw new Error(exception);
            }
            var refConfig = utils.getModels()[refModel.modelName];

            if (!(refConfig.shard && refConfig.shard.shardKey) && field.shard) {
                log.warn("Trying to set shard option", field.shard, "in field", fullKey, "with no sharding enabled for model", refModel.modelName);
            }

            if (field.denormalize) {
                denormalizer.denormalize(field, fullKey, Model, fromArray || false, absolutePath);
            } else if (refConfig.id != "_id") {
                field.denormalize = refConfig.id;
                denormalizer.denormalize(field, fullKey, Model, fromArray || false, absolutePath);
            }

            injectRefs(app, modelConfig, refConfig, Model, refModel, fullKey);
        } else if (field.type == "object" && field.properties && field.properties.image && field.properties.image.format && field.properties.image.format == 'image') {
            injectImages(app, Model, fullKey);
        } else if (field.type == "object" && field.properties && field.properties.file && field.properties.file.format && field.properties.file.format == 'file') {
            injectFiles(app, Model, fullKey);
        } else if (field.type == "array") {
            injectArrays(app, field, fullKey, Model, modelConfig, absolutePath);
        } else if (field.type == "object") {
            walkSchema(app, Model, field.items || field.properties, fullKey, false, absolutePath);
        } else if (field.type == "image" && fromArray) {
            newImages.injectImages(app, {model: Model, url: fullKey, field: fullKey, multi: true, inObject: true});
        } else if (field.type == "image") {
            injectNewImages(app, Model, fullKey);
        }
    }
}

function injectRefs(app, baseConfig, refConfig, Model, refModel, key) {
    //app.get(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key, refConfig.get.middleware || [], refs.getRefField(Model, baseConfig.id, refModel, key));
    log.debug("[GET] Injecting direct reference. " + Model.modelName + "." + key + " --> " + refModel.modelName);
    app.get(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key,
        refConfig.get.middleware || [],
        typeBased.directReference(Model, baseConfig.id, refModel, key)
    );

    log.debug("[GET] Injecting indirected reference. " + injector.config.routes.prefix + '/' + baseConfig.plural + '/' + key + '/:' + refConfig.id)
    app.get(injector.config.routes.prefix + '/' + baseConfig.plural + '/' + key + '/:' + refConfig.id,
        baseConfig.search.middleware || [],
        typeBased.indirectReferenceGet(Model, refModel, key)
    );

    log.debug("[POST] Injecting indirected reference. " + injector.config.routes.prefix + '/' + baseConfig.plural + '/' + key + '/:' + refConfig.id)
    app.post(injector.config.routes.prefix + '/' + baseConfig.plural + '/' + key + '/:' + refConfig.id,
        baseConfig.search.middleware || [],
        typeBased.indirectReferencePost(Model, refModel, key)
    );

//app.post(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key + '/values', refConfig.search.middleware || [], refs.getQueriedRefField(Model, baseConfig.id, refModel, key));
//log.debug("Injecting direct queried reference. " + Model.modelName + "." + key + " --> " + refModel.modelName);
//
//app.get(injector.config.routes.prefix + '/' + refConfig.path + '/:' + (refConfig.id) + '/' + key + '/' + baseConfig.plural, baseConfig.search.middleware || [], refs.getInvRefField(refModel, Model, key));
//log.debug("Injecting indirect reference. " + refModel.modelName + "(s) from " + Model.modelName + "." + key);
}

function injectImages(app, Model, key) {
    log.debug("Inject images for model " + Model.modelName + " and field " + key);
    images.injectImages(app, {model: Model, url: key, field: key});
}

function injectNewImages(app, Model, key) {
    log.debug("Inject images for model " + Model.modelName + " and field " + key);
    newImages.injectImages(app, {model: Model, url: key, field: key});
}

function injectFiles(app, Model, key) {
    log.debug("Inject files for model " + Model.modelName + " and field " + key);
    files.injectFiles(app, {model: Model, url: key, field: key});
}

function injectArrays(app, field, key, Model, baseConfig, rawPath) {
    log.debug("Inject array methods for model " + Model.modelName + " and field " + key);
    //app.get(gConfig.apiBasePath + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key, refs.getAllArray(Model, key));
    //app.get(gConfig.apiBasePath + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key + '/:index', refs.getArrayElementAt(Model, key));

    if (field.items.type == "object" && field.items.properties && field.items.properties.image && field.items.properties.image.format && field.items.properties.image.format == 'image') {
        images.injectImages(app, {model: Model, url: key, field: key, multi: true});
    } else if (field.items.ref) {
        var refModel = mongoose.model(field.items.ref);
        var refConfig = utils.getModels()[refModel.modelName];


        if (field.items.denormalize) {
            denormalizer.denormalize(field.items, key, Model, true, rawPath);
        } else if (refConfig.id != "_id") {
            field.denormalize = refConfig.id;
            denormalizer.denormalize(field.items, key, Model, true, rawPath);
        }

    } else if (field.items.type == "object" && field.items.properties) {
        walkSchema(app, Model, field.items.properties, key, true, rawPath);

        app.post(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key, refs.appendArrayElement(Model, key));
        app.post(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key + '/:index', refs.postArrayElementAt(Model, key));
    } else if (field.items.type == "image") {
        newImages.injectImages(app, {model: Model, url: key, field: key, multi: true});
    } else {
        app.post(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key, refs.appendArrayElement(Model, key));
        app.post(injector.config.routes.prefix + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key + '/:index', refs.postArrayElementAt(Model, key));
        //app.put(gConfig.apiBasePath + '/' + baseConfig.path + '/:' + baseConfig.id + '/' + key + '/:index', refs.putArrayElementAt(Model, key));
    }
}