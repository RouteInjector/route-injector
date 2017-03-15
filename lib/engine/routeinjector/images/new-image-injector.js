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
var imagePath;
var cachePath;
var modelsInjected = {}; //TODO: w solve this ñapa ?


if (injector.config.env.images && injector.config.env.images.galleryFolder) {
    injector.app.get("/gallery", function (req, res) {
        var folder = injector.config.env.images.galleryFolder;
        fs.readdir(folder, function (err, files) {
            if (files) {
                async.map(files, function (val, cb) {
                        var fPath = path.join(folder, val);
                        fs.stat(fPath, function (err, statRes) {
                            var d = (err) ? '' : new Date(statRes.mtime);
                            cb(null, {
                                name: val,
                                value: '/gallery/get/' + val,
                                imageUrl: '/gallery/get/' + val,
                                date: d
                            });
                        });
                    },
                    function (err, result) {
                        result = result.sort(function (a, b) {
                            return b.date - a.date;
                        });
                        res.json(result);
                        return res.end();
                    });
            } else {
                res.json([]);
                return res.end();
            }
        });
    });

    injector.app.use("/gallery/get", injector.internals.express.static(injector.config.env.images.galleryFolder));

    injector.app.post("/gallery/insert", function (req, res) {
        var outDirectory = injector.config.env.images.galleryFolder;

        function uploadFile(item, cb) {
            fs.exists(item.path, function (exists) {
                if (exists) {
                    //TODO pass as setting paramter
                    if (1 == 0) {//Get file name as randoom
                        var fileName = (new Date()).getTime().toString();
                        fileName += "." + getExtension(item.path);
                        process();
                    } else {//Get file name from source file
                        getFileNameFromFile(outDirectory, item.originalname, function (err, name) {
                            if (err) {
                                throw err;
                            }
                            else {
                                fileName = name;
                                process();
                            }
                        });
                    }

                    function process() {
                        var outFile = path.join(outDirectory, fileName);//path.basename(req.files.image.path));
                        log.debug('File: ', outFile);
                        mkdirp(outDirectory, function (err) {
                            if (err) {
                                throw err;
                            }
                            log.debug("File " + item.path + " is being copied as " + outFile);
                            copyFile(item.path, outFile, function (err) {
                                if (err) throw err;

                                if (cb) cb();
                            });
                        });
                    }
                }
            });
        }

        if (req.files["file[]"]) {
            if (req.files["file[]"] instanceof Array) {
                async.each(req.files["file[]"], function (item) {
                    if (item != undefined) {
                        uploadFile(item);
                    }
                }, function (err) {
                    if (err) {
                        res.statusCode = statusCode.InternalServerError();
                        res.json(err);
                    }
                    return res.end();
                });
            } else {
                uploadFile(req.files["file[]"], function () {
                    res.json({message: 'image uploaded properly'});
                    res.end();
                });
            }
        }
    });
}


exports.injectImages = function (_app, param) {

    var imageConf = injector.config.env.images;
    imagePath = imageConf.path;
    cachePath = imageConf.cache;
    if (param.multi === undefined) {
        param.multi = false;
    }

    var c = param.model.injector();

    param.folder = param.model.modelName.toLowerCase();
    param.out = path.join(imagePath, param.folder);

    var prefix = injector.config.routes.prefix;

    var injected = modelsInjected[param.model.modelName];
    if (param.model.injector().images) {

        if (!injected) {
            if (param.model.injector().images.get) {
                _app.get(prefix + '/' + c.path + '/image/:path', param.model.injector().images.get);
                _app.get(prefix + '/' + c.path + '/image/:path/:size', param.model.injector().images.get);
            } else {
                _app.get(prefix + '/' + c.path + '/image/:path', getAbsoluteImage(param));
                _app.get(prefix + '/' + c.path + '/image/:path/:size', getAbsoluteImage(param));
            }

            if (param.model.injector().images.delete) {
                _app.delete(prefix + '/' + c.path + '/:' + c.id + '/' + param.url + '/:path', param.model.injector().images.delete);
            } else {
                _app.delete(prefix + '/' + c.path + '/:' + c.id + '/' + param.url + '/:path', deleteImage(param));
            }
        }

        if (param.model.injector().images.post) {

            _app.post(prefix + '/' + c.path + '/:' + c.id + '/' + param.url, param.model.injector().images.post);
        } else {
            _app.post(prefix + '/' + c.path + '/:' + c.id + '/' + param.url, insertImage(param));
        }

    } else {

        //_app.get(prefix + '/' + c.path + '/:' + c.id + '/' + param.field + '/:size', getImage(param));
        if (!injected) {
            _app.get(prefix + '/' + c.path + '/image/:path', getAbsoluteImage(param));
            _app.get(prefix + '/' + c.path + '/image/:path/:size', getAbsoluteImage(param));
            _app.delete(prefix + '/' + c.path + '/:' + c.id + '/' + param.url + '/:path', deleteImage(param));
        }
        _app.post(prefix + '/' + c.path + '/:' + c.id + '/' + param.url, insertImage(param));
    }

    param.model.schema.post('remove', function (doc) {
        var field = doc[param.url.replace('/', '.')];
        if (field && field.fullPath) {//Same as field.image
            deleteFullPathImage(path.join(param.out, field.fullPath), function (err) {
                if (err) return log.error(err);
            });
            clearCache(param.folder, field.image)
        }
    });
    modelsInjected[param.model.modelName] = true;
};

function getAbsoluteImage(param) {
    return function (req, res) {
        var redUrl = "";
        if (req.params["size"]) {
            redUrl = '/images/' + param.folder + '/' + req.params["size"] + '/' + req.params.path;
        } else {
            redUrl = '/images/' + param.folder + '/0x/' + req.params.path;
        }

        return res.redirect(redUrl);
    };
}


//TODO Finish this
function clearCache(model, imageName) {
    glob(path.join(cachePath, model, "**", imageName), function (err, files) {

        for (var i = 0; i < files.length; i++) {
            fs.unlink(files[i], function (err) {
                if (err) {
                    log.error('Problem delete cache file ' + files[i], err);
                }
            });
        }

    });
}

function insertImage(param) {
    return function (req, res) {
        var outDirectory = param.out;
        if (req.files.image != undefined) {
            //ext includes '.'
            log.debug("Path: " + req.files.image.path);
            log.debug(req.files.image);

            fs.exists(req.files.image.path, function (exists) {
                    if (exists) {
                        //TODO pass as setting paramter to select file name (randoom, original)
                        var fileName = (1 == 0) ? (new Date()).getTime().toString() : null;
                        if (fileName == null) {
                            getFileNameFromFile(outDirectory, req.files.image.originalname, function (err, name) {
                                if (err) {
                                    throw err;
                                }
                                fileName = name;
                                process();
                            });
                        } else {
                            fileName = (new Date()).getTime().toString() + "." + getExtension(req.files.image.path);
                            process();
                        }

                        function process() {

                            var outFile = path.join(outDirectory, fileName);//path.basename(req.files.image.path));

                            var fileToDb = {
                                image: fileName,
                                fullPath: fileName,
                                originalName: req.files.image.originalname,
                            };

                            log.debug('File: ', outFile);

                            mkdirp(outDirectory, function (err) {
                                if (err) {
                                    throw err;
                                }

                                log.debug("File " + req.files.image.path + " is being copied as " + outFile);
                                copyFile(req.files.image.path, outFile, function (err) {
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
                                                            var body = JSON.parse(req.body.data);
                                                            // Image inside an object which is inside an array. Array > Object > Image
                                                            if (param.inObject) {
                                                                var p0 = param.field.split(".")[0];
                                                                var p1 = param.field.split(".")[1];
                                                                var i = body.index;
                                                                if (!doc[p0] || doc[p0].length == 0)
                                                                    doc[p0] = [];
                                                                if (i != undefined) {
                                                                    var elem = doc[p0][i];
                                                                    if (!elem) {
                                                                        elem = {};
                                                                    }
                                                                    elem[p1] = fileToDb;
                                                                    doc[p0].set(i, elem);
                                                                } else {
                                                                    var t = {};
                                                                    t[p1] = fileToDb;
                                                                    doc[p0].push(t);
                                                                }
                                                            } else { //Image is inside an array
                                                                if (!doc[param.field] || doc[param.field].length == 0)
                                                                    doc[param.field] = [];

                                                                if (body.index != undefined) {
                                                                    doc[param.field].set(body.index, fileToDb);
                                                                } else {
                                                                    doc[param.field].push(fileToDb);
                                                                }
                                                            }
                                                            doc.save(function (err, doc) {
                                                                if (err) {
                                                                    res.statusCode = 500;
                                                                    res.json({
                                                                        error: "Internal server error"
                                                                    });
                                                                } else {
                                                                    res.statusCode = 201;
                                                                }
                                                                return res.end();
                                                            });
                                                        }
                                                    }
                                                )
                                                ;
                                            }
                                            else {
                                                var _set = {};
                                                _set[param.field] = fileToDb;

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
                                    }
                                )
                                ;//END copyfile
                            });//END mkpdir
                        }//END if
                    }//END process
                }
            )
            ; //END fs.exists
        }//END if(req.files.image!=undefined)
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

function deleteFullPathImage(filePath, cb) {
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
            cb("image not found: " + filePath);
        }
    });
}

function deleteImage(param) {
    return function (req, res) {
        var filePath = req.params.path;

        deleteFullPathImage(path.join(param.out, filePath), function (err) {
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
