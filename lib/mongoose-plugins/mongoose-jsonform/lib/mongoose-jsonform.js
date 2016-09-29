/*!
 * mongoose-jsonform - lib/mongoose-jsonform.js
 * Copyright(c) 2013 jussiva <jussiva@gmail.com>
 * MIT Licensed
 */
/**
 * Module dependencies.
 */
var _ = require('underscore');

var jsonform = function (schema, options) {

    if (!options) options = {excludedPaths: [], includedPaths: false};
    if (!Array.isArray(options.excludedPaths)) {
        options.excludedPaths = ['__v', options.excludedPaths];
    }
    function getType(pathString, mongotype) {
        switch (mongotype) {
            case('String'):
            case('SchemaString'):
                return {type: 'string'};
            case('SchemaDate'):
                return {type: 'string', format: 'date'};
            case('SchemaBoolean'):
                return {type: 'boolean'};
            case('SchemaNumber'):
                return {type: 'number'};
            case('ObjectId'):
                return {type: 'string'};
            case('ObjectID'):
                return {type: 'string'};
            case('DocumentArray'):
                return {type: 'array', items: {type: 'object', properties: {}}};
            case('SchemaArray'):
                return {type: 'array', items: {}};
            case('Mixed'):
                return {type: 'object', mixed: true};
            case('Image'):
                return {type: 'image'}
            default:
                return {type: pathString.constructor.name.toLowerCase(), format: 'mixed'};
        }
    }

    function convertTypeOptions(type, options) {
        function replace(obj, key, newKey) {
            if (obj[key]) {
                obj[newKey] = obj[key];
                delete obj[key];
            }
        }

        switch (type) {
            case('number'):
                replace(options, 'min', 'minimum');
                replace(options, 'max', 'maximum');
                break;
            default:
                break;
        }
        return options;
    }

    function addCustomOptions(pathO) {
        if (pathO.options.format === 'image') {
            pathO.options.path = (pathO.arraypath || pathO.path).split('.image')[0].replace('.', '/');
        }
        if (pathO.options.format === 'file') {
            pathO.options.path = (pathO.arraypath || pathO.path).split('.file')[0].replace('.', '/');
        }
    }

    /**
     * jsonform.
     */
    schema.methods.jsonform = function (opt) {
        var self = this;
        var jf = {};
        if (!opt) opt = {excluded: [], includes: '*', setDefaults: false};
        if (!opt.includes) opt.includes = '*';

        var excludedPaths = _.union(options.excludedPaths, opt.excludes);
        var includedPaths = _.union(options.includedPaths, opt.includes);


        // TODO: Optionally supply fullPath arrgument to know the fullpath if it's inside an object or an array
        function parseSchema(subschema, out, fullPath) {
            subschema.eachPath(function (pathString, pathO) {

                var include = excludedPaths.indexOf(pathString) === -1;
                if (include && opt.includes != '*')
                    include = includedPaths.indexOf(pathString) !== -1;

                if (include) {
                    var type = getType(pathString, pathO.constructor.name);
                    var defaultValue = false;
                    //if( self.isInit(pathString) )
                    defaultValue = self.get(pathString);

                    function iterate(path, obj) {
                        if (matches = path.match(/([^.]+)\.(.*)/)) {
                            var key = matches[1];
                            if (!obj[key]) {
                                obj[key] = {type: 'object', properties: {}}
                            }
                            iterate(matches[2], obj[key].properties);
                        } else {
                            if (['string', 'date', 'boolean', 'number', 'object', 'image'].indexOf(type.type) >= 0) {
                                obj[path] = {};
                                if (_.isFunction(pathO.options.default)) {
                                    type.default = pathO.options.default();
                                }
                                if (defaultValue && opt.setDefaults) {
                                    pathO.options.default = defaultValue;
                                    if (type.type == 'date') {
                                        pathO.options.default = pathO.options.default.toISOString();
                                    }
                                }
                                // TODO: Check if fullpath is undefined. If it is, attach it to options
                                if (fullPath) {
                                    pathO.arraypath = fullPath + '.' + pathString;
                                }
                                addCustomOptions(pathO);
                                _.extend(obj[path], convertTypeOptions(type.type, pathO.options), type);
                            } else if (type.type == 'array') {
                                obj[path] = type;
                                if (type.items.type == 'object') {
                                    // TODO: Pass to the the parseSchema the current path
                                    parseSchema(pathO.schema, obj[path].items.properties, pathO.path);
                                }
                                else {
                                    //console.log( pathString+': options:'+JSON.stringify(pathO.options.type[0]) );
                                    type = getType(pathString, pathO.caster.instance);

                                    if (_.isFunction(pathO.options.default)) {
                                        type.default = pathO.options.default();
                                    }
                                    if (defaultValue && opt.setDefaults) {
                                        pathO.options.default = defaultValue;
                                        if (type.type == 'date') {
                                            pathO.options.default = pathO.options.default.toISOString();
                                        }
                                    }
                                    _.extend(obj[path].items, convertTypeOptions(type.type, pathO.options.type[0]), type);

                                }
                            } else {
                                console.log('unsupported type: ' + type.type);
                            }
                        }
                    }

                    iterate(pathString, out);
                }
            });
        }

        parseSchema(schema, jf);
        return jf;
    }
};
module.exports = exports = jsonform;