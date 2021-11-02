var Q = require('q');
var statusCode = require('http-status-codes');
var utils = require('../utils');
var deepjson2csv = require('deepjson2csv');
var json2xls = require('json2xls');
var _ = require('lodash');
const Packer = require('zip-stream');
const zlib = require('zlib');
const Excel = require('exceljs');

var injector = require('../../../');
var log = injector.log;
const { Transform } = require('stream');
const Hooks = require("../../../utils/HooksUtils");

class RITransform extends Transform {
    constructor(parentOptions, RIOptions) {
        super(parentOptions);

        RIOptions.res.attachment(RIOptions.modelName + RIOptions.format);

        if (RIOptions.postHook && RIOptions.postHook.length) {

            this.postHook = (doc, cb) => {
                return Hooks.funcMerge(RIOptions.postHook)(doc, cb, {
                    ctx: {
                        req: RIOptions.req,
                        res: RIOptions.res,
                        config: RIOptions.config
                    }
                });
            }

        } else {
            this.postHook = (doc, cb) => cb(doc);
        }

        if (RIOptions.format === ".zip") {
            this.selector = RIOptions.selector;
            this.archive = new Packer({
                zlib: {
                    level: 9
                }
            });

            this.on("finish", () => {
                this.archive.finalize();
            });

            this.archive.on("error", () => {
                this.emit("error");
            });

        } else if (RIOptions.format === ".xlsx") {

            this.workbook = new Excel.stream.xlsx.WorkbookWriter({
                stream: RIOptions.res
            });

            this.worksheet = this.workbook.addWorksheet(RIOptions.modelName);

            this.worksheet.state = 'visible';

            this.on("finish", async () => {
                await this.workbook.commit();
            });
        }
    }

    pipe(output) {
        if (this.archive)
            this.archive.pipe(output);
        else if (!this.workbook) {
            return super.pipe(output);
        }   
            
    }
}

module.exports.export = function (Model) {
    /*var doc = new Model({});
     var schema = doc.jsonform({});

     var validFields = [];
     //Walk the schema another time.... Should we improve this ?
     for (var key in schema) {
     if (key == '_id' || key == '__v')
     continue;

     var type = schema[key].type;
     if (type == "string" || type == "number" || type == "boolean") {
     log.info("KEY:", key);
     validFields.push(key);
     }
     }*/

    var keys = Object.keys(Model.schema.paths);

    var validFields = [];
    for (var i in keys) {
        var key = keys[i];
        var type = Model.schema.paths[key].options.type;

        if (key == '_id' || key == '__v')
            continue;
        if (type == String) {
            validFields.push(key);
        } else if (type == Number) {
            validFields.push(key);
        } else if (type == Boolean) {
            validFields.push(key);
        } else if (type == Date) {
            validFields.push(key.toString());
        } else {

            if (type.name && type.name === "Mixed") {

                if (!Model.schema.paths[key].options.denormalize) {

                    log.warn("Mixed type without denormalize => Offending model: " + Model.modelName + " Offending field: " + key);

                } else {
                    /* References */

                    for (let field of Model.schema.paths[key].options.denormalize)
                        validFields.push(key + "." + field);

                }
            }
        }
    }

    const transformers = {
        csv: {
            transform(chunk, encoding, callback) {
                try {

                    var data = '';

                    if (!this.start) {
                        data += validFields.join(',') + '\n';
                        this.start = true;
                    }

                    let json = JSON.parse(chunk.toString());

                    this.postHook(json, (elem) => {

                        if (elem) {

                            data += validFields.reduce((acum, key) => {

                                let value = _.get(elem, key);

                                return acum ? acum + (value ? ',' + `"${value.toString().replace('"', '\"')}"` : ',') : (value ? `"${value.toString().replace('"', '\"')}"` : '');

                            }, '') + '\n';

                            callback(null, data);
                        } else
                            callback(null);
                    });

                } catch (err) {
                    callback(err);
                }
            }
        },
        json: {
            transform(chunk, encoding, callback) {
                try {

                    var data = '';

                    let json = JSON.parse(chunk.toString());

                    this.postHook(json, (elem) => {

                        if (elem) {

                            if (!this.start) {
                                data += "[" + JSON.stringify(elem);
                                this.start = true;
                            } else {
                                data += "," + JSON.stringify(elem);
                            }

                            callback(null, data);

                        } else
                            callback(null);
                    });

                } catch (err) {
                    callback(err);
                }
            },
            flush(callback) {
                callback(null, this.start ? "]" : "[]");
            }
        },
        zip: {
            transform(chunk, encoding, callback) {
                try {

                    let json = JSON.parse(chunk.toString());

                    this.postHook(json, (elem) => {

                        if (elem) {

                            let name = elem[this.selector] ? elem[this.selector] + '.json' : Math.random().toString(16).substring(2, 9) + '.json';

                            this.archive.entry(JSON.stringify(elem), { name }, function (err, entry) {

                                if (err)
                                    callback(err);
                                else
                                    callback(null);
                            });

                        } else
                            callback(null);
                    });

                } catch (err) {
                    callback(err);
                }
            }
        },
        xlsx: {
            transform(chunk, encoding, callback) {
                try {

                    if (!this.start) {
                        this.worksheet.addRow(validFields).commit();
                        this.start = true;
                    }

                    let json = JSON.parse(chunk.toString());

                    this.postHook(json, (elem) => {

                        if (elem) {

                            let data = validFields.map((key) => _.get(elem, key));
                            this.worksheet.addRow(data).commit();

                        }

                        callback(null);
                    });

                } catch (err) {
                    callback(err);
                }
            }
        },
        default: {
            transform(chunk, encoding, callback) {
                callback(null, chunk);
            }
        },
    }

    return function (req, res) {
        if (!req.body) req.body = {};
        if (!req.body.query) req.body.query = {};

        if (req.headers['content-type'] == 'application/x-www-form-urlencoded') {
            req.body.query = JSON.parse(req.body.query);
        }

        var gConfig = Model.injector();
        var config = utils.getConfigByProfile(gConfig.export, req);

        (config.pre) ? utils.runPreCallbacks(config.pre, Model, req, res, mainGetNPostFn) : mainGetNPostFn();

        function mainGetNPostFn() {
            var format = req.body.format || req.query.format || "csv";
            var query = req.body.query;

            var options = {};
            _.assign(options, config.mongo.options);
            options.skip = req.query.skip || req.body.skip;
            options.limit = req.query.limit || req.body.limit;
            options.sort = req.query.sortBy || req.body.sortBy;

            //Shard key insertion if shard is enabled
            if (gConfig.shard && gConfig.shard.shardKey && gConfig.shard.shardKey != "") {
                var shard = req.query[gConfig.shard.shardKey] || req.body[gConfig.shard.shardKey];
                if (shard) {
                    query[gConfig.shard.shardKey] = shard;
                }
            }

            let extension;

            switch (format) {
                case "json+zip": {
                    extension = '.zip';
                }
                    break;
                default: {
                    extension = "." + format;
                }
                    break;
            }

            const dataTransformer = new RITransform(
                transformers[extension.slice(1)] || transformers.default,
                {
                    res,
                    req,
                    modelName: Model.modelName,
                    format: extension,
                    selector: req.body.by || req.query.by || "_id",
                    postHook: config.post,
                    config
                }
            );

            // TODO: In order to add a restriction in this case the body and the config JSON should be merged.
            const MongoQuery = Model.find(query, config.mongo.projection, options);

            if (config.populate) {
                if (!(config.populate instanceof Array)) throw 'populate field in ' + Model.modelName + ' routerInjector configuration should be an array';

                MongoQuery.populate(config.populate);
            }

            MongoQuery
                .cursor({ transform: JSON.stringify })
                .pipe(dataTransformer)
                .pipe(res);

            // function exp(result, err) {
            //     if (err) {
            //         log.error(err);
            //         res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
            //         res.json(err);
            //         return res.end();
            //     }

            //     (config.populate) ? utils.dynamicPopulate(config.populate, Model, result, okCallbackTask) : okCallbackTask();

            //     function okCallbackTask() {
            //         (config.post && config.post.length > 0) ? utils.runPostCallbacks(config, req, res, result, function () {
            //             res.end();
            //         }) : endOK();
            //     }

            //     function endOK() {
            //         //var fields = _.intersect(validFields, config.mongo.projection);
            //         var fields = validFields;
            //         if (format) {
            //             if (format == 'csv') {
            //                 deepjson2csv({
            //                     data: result,
            //                     fields: fields //TODO Make it configurable
            //                 },
            //                     function (err, csv) {
            //                         if (err) {
            //                             res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
            //                             res.json("Error generating CSV");
            //                             return res.end();
            //                         } else {
            //                             res.statusCode = statusCode.OK;
            //                             res.attachment(Model.modelName + ".csv");
            //                             return res.end(csv, 'UTF-8');
            //                         }
            //                     }
            //                 );
            //             } else if (format == 'xlsx') {
            //                 var xls = json2xls(result, { fields: fields });
            //                 res.statusCode = statusCode.OK;
            //                 res.attachment(Model.modelName + ".xlsx");
            //                 return res.end(xls, 'binary');

            //             } else if (format == 'json') {
            //                 res.statusCode = statusCode.OK;
            //                 res.attachment(Model.modelName + ".json");
            //                 return res.end(JSON.stringify(result), 'UTF-8');
            //             } else if (format == 'json+zip') {
            //                 var by = req.body.by || req.query.by || "_id";
            //                 res.statusCode = statusCode.OK;

            //                 //Create tmp folder
            //                 var fs = require('fs');
            //                 var JSZip = require('node-zip');
            //                 var zip = new JSZip();
            //                 zip.file(Model.modelName + '.zip');

            //                 //Export all the models
            //                 for (var i in result) {
            //                     var doc = result[i];
            //                     var fileName = doc[by] + ".json";
            //                     //fs.writeFileSync(fileName, doc, 'UTF-8');
            //                     zip.file(fileName, JSON.stringify(doc));
            //                 }

            //                 //ZIP file
            //                 var outputData = zip.generate({ base64: false, compression: 'DEFLATE' });

            //                 //Remove tmp folder
            //                 //Attach the file
            //                 res.attachment(Model.modelName + ".zip");
            //                 return res.end(outputData, 'binary');
            //             } else {
            //                 res.statusCode = statusCode.BAD_REQUEST;
            //                 res.json("Invalid format");
            //                 return res.end();
            //             }
            //         } else {
            //             res.statusCode = statusCode.BAD_REQUEST;
            //             res.json("Missing format");
            //             return res.end();
            //         }
            //     }
            // }
        }
    };
};