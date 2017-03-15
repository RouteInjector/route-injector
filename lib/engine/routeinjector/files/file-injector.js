var mkdirp = require('mkdirp');
var fs = require('fs');
var glob = require('glob');
var async = require('async');
var path = require('path');
var statusCode = require('statusCode');
var multer = require('multer');
var _ = require('lodash');

var injector = require('../../../');
var log = injector.log;
var filesPath;
var cachePath;
var modelsInjected = {}; //TODO: How solve this ñapa ?


exports.injectFiles = function (_app, param) {

    var filesConf = injector.config.env.files;
    filesPath = filesConf.path;

    if (param.multi === undefined) {
        param.multi = false;
    }

    var c = param.model.injector();

    param.folder = param.model.modelName.toLowerCase();
    param.out = path.join(filesPath, param.folder);

    var prefix = injector.config.routes.prefix;

    var injected = modelsInjected[param.model.modelName];

    if (!injected) {
        _app.get(prefix + '/' + c.path + '/file/:path', getAbsoluteFile(param));
        _app.delete(prefix + '/' + c.path + '/:' + c.id + '/' + param.url + '/:path', deleteFile(param));
    }
    _app.post(prefix + '/' + c.path + '/:' + c.id + '/' + param.url, insertFile(param));

    param.model.schema.post('remove', function (doc) {
        var field = doc[param.url.replace('/', '.')];
        if (field.fullPath) {//Same as field.image
            deleteFullPathFile(path.join(param.out, field.fullPath), function (err) {
                if (err) return log.error(err);
            });
        }
    });
    modelsInjected[param.model.modelName] = true;
};

function getAbsoluteFile(param) {
    return function (req, res) {
        var redUrl = '/files/' + param.folder + '/' + req.params.path;
        return res.redirect(redUrl);
    };
}

function insertFile(param) {
    return function (req, res) {
        var outDirectory = param.out;
        if (req.files.file != undefined) {
            //ext includes '.'
            log.debug("Path: " + req.files.file.path);
            log.debug(req.files.file);

            fs.exists(req.files.file.path, function (exists) {
                if (exists) {
                    //TODO pass as setting paramter to select file name (randoom, original)
                    var fileName = (1 == 0) ? (new Date()).getTime().toString() : null;
                    if (fileName == null) {
                        getFileNameFromFile(outDirectory, req.files.file.originalname, function (err, name) {
                            if (err) {
                                throw err;
                            }
                            fileName = name;
                            process();
                        });
                    } else {
                        fileName = (new Date()).getTime().toString() + "." + getExtension(req.files.file.path);
                        process();
                    }

                    function process() {

                        var outFile = path.join(outDirectory, fileName);//path.basename(req.files.file.path));
                        log.debug('File: ', outFile);

                        mkdirp(outDirectory, function (err) {
                            if (err) {
                                throw err;
                            }

                            log.debug("File " + req.files.file.path + " is being copied as " + outFile);
                            copyFile(req.files.file.path, outFile, function (err) {
                                if (!err) {

                                    var c = param.model.injector();

                                    var where = {};
                                    where[c.id] = req.params[c.id];

                                    //Shard key insertion if shard is enabled
                                    if (c.shard && c.shard.shardKey && req.query[c.shard.shardKey] != undefined) {
                                        where[c.shard.shardKey] = req.query[c.shard.shardKey];
                                    }

                                    if (param.multi == true) {
                                        param.model.findOne(where, {}, function (e, doc) {
                                            if (e) {
                                                log.error(e);
                                                res.json(e);
                                                res.statusCode = statusCode.InternalServerError();
                                                return res.end();
                                            }
                                            else {
                                                var filesarray = _.get(doc, param.field, []);

                                                if (filesarray instanceof Array) {
                                                    var body = JSON.parse(req.body.data);
                                                    if (body.index != undefined) {
                                                        var pos = body.index;

                                                        //Check if we are adding a new file
                                                        if (filesarray[pos] == undefined && filesarray.length == pos)
                                                            filesarray.push({});

                                                        //Check if the position is inside of bounds
                                                        if (pos > filesarray.length) {
                                                            pos = filesarray.length;
                                                            filesarray.push({});
                                                        }

                                                        //Store the information of the file
                                                        filesarray[pos].file = fileName;
                                                        filesarray[pos].fullPath = fileName;
                                                        filesarray[pos].originalName = req.files.file.originalname;

                                                        //Clean the array
                                                        var filtered = filesarray.filter(function (value) {
                                                            return value.file && value.fullPath && value.originalName;
                                                        });

                                                        _.set(doc, param.field, filtered);

                                                        doc.save(function (err) {
                                                            if (err) log.error("Error inserting file", err);
                                                        });

                                                        res.statusCode = statusCode.Created();
                                                        return res.end();
                                                    } else {
                                                        var _set = {};
                                                        _set[param.field] = {};
                                                        _set[param.field]["file"] = fileName;
                                                        _set[param.field]["fullPath"] = fileName;
                                                        _set[param.field]["originalName"] = req.files.file.originalname;
                                                        param.model.findOneAndUpdate(where, {$addToSet: _set}, {}, function (e, result) {
                                                            if (e) {
                                                                log.error(e);
                                                                res.json(e);
                                                                res.statusCode = statusCode.InternalServerError();
                                                                return res.end();
                                                            }

                                                            res.json(outFile);
                                                            return res.end();
                                                        });
                                                    }
                                                }
                                            }
                                        });
                                    } else {
                                        var _set = {};
                                        _set[param.field] = {};
                                        _set[param.field]["file"] = fileName;
                                        _set[param.field]["fullPath"] = fileName;
                                        _set[param.field]["originalName"] = req.files.file.originalname;

                                        param.model.findOneAndUpdate(where, {$set: _set}, {}, function (e, result) {
                                            if (e) {
                                                log.error(e);
                                                res.json(e);
                                                res.statusCode = statusCode.InternalServerError();
                                                return res.end();
                                            }

                                            //res.json(outFile);
                                            return res.end();
                                        });
                                    }
                                }
                            });//END copyfile
                        });//END mkpdir
                    }//END if
                }//END process
            }); //END fs.exists
        }//END if(req.files.file!=undefined)
        else {
            return '';
        }
    }//END return function(req,res)
}

function getFileNameFromFile(outDirectory, sourceFileName, cb) {
    var fileName = null;
    sourceFileName = sourceFileName.toLowerCase();

    if (!fs.existsSync(outDirectory)) {
        fs.mkdirSync(outDirectory);
    }

    fs.readdir(outDirectory, function (err, files) {
        var i = 0;
        if (err) {
            cb(err, null);
        } else {
            if (files.length > 0) {
                while (fileName == null) {
                    var l = files.filter(function (f) {
                        if (i == 0) {
                            return f.toLowerCase() == sourceFileName;
                        } else {
                            return f.toLowerCase() == addStringBeforeExtension(sourceFileName, '_' + i);
                        }
                    }).length;

                    if (l == 0) {
                        if (i == 0) {
                            fileName = sourceFileName;
                        } else {
                            fileName = addStringBeforeExtension(sourceFileName, '_' + i);
                        }
                    } else {
                        i++;
                    }
                }
            } else {
                fileName = addStringBeforeExtension(sourceFileName, '_' + i)
            }
            cb(null, fileName);
        }
    });
}

function addStringBeforeExtension(filename, text) {
    var ext = getExtension(filename);
    filename = filename.replace('.' + ext, '');
    return filename + text + '.' + ext;

}
function getExtension(filename) {
    var ext = path.extname(filename || '').split('.');
    return ext[ext.length - 1];
}

function copyFile(source, target, cb) {
    var cbCalled = false;

    var rd = fs.createReadStream(source);
    rd.on("error", function (err) {
        done(err);
    });
    var wr = fs.createWriteStream(target);
    wr.on("error", function (err) {
        done(err);
    });
    wr.on("close", function (ex) {
        done();
    });
    rd.pipe(wr);

    function done(err) {
        if (!cbCalled) {
            cb(err);
            cbCalled = true;
        }
    }
}

function deleteFullPathFile(filePath, cb) {
    fs.exists(filePath, function (exists) {
        if (exists) {
            fs.unlink(filePath, function (err) {
                if (err) {
                    cb(err);
                } else {
                    cb()
                }
            });
        }
        else {
            cb("file not found: " + filePath);
        }
    });
}

function deleteFile(param) {
    return function (req, res) {
        var filePath = req.params.path;

        deleteFullPathFile(path.join(param.out, filePath), function (err) {
            if (err) {
                res.statusCode = statusCode.InternalServerError();
                res.json(err);
                return res.end();
            } else {
                res.statusCode = statusCode.OK();
                return res.end();
            }
        });
    }
}
