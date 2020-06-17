"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
/**
 * Created by gerard on 1/18/16.
 */
///<reference path='../../typings/index.d.ts'/>
var fs = require("fs");
var path = require("path");
var mime = require("mime");
var mkdirp = require("mkdirp");
var fg = require("fast-glob");
var util_1 = require("util");
var FSUtils = /** @class */ (function () {
    function FSUtils() {
    }
    /**
     * Get the directories from the existing src path
     * @param srcpath
     * @returns {any}
     */
    FSUtils.getDirectories = function (srcpath) {
        if (fs.existsSync(srcpath)) {
            return fs.readdirSync(srcpath).filter(function (file) {
                return fs.statSync(path.join(srcpath, file)).isDirectory();
            });
        }
        else {
            return [];
        }
    };
    /**
     * Get path from a module
     *
     * @param module
     * @returns {string}
     */
    FSUtils.getModulePath = function (module) {
        return path.dirname(require.resolve(module));
    };
    /**
     * Check if a directory or a file exists
     * @param path
     * @returns {boolean}
     */
    FSUtils.exists = function (path) {
        return fs.existsSync(path);
    };
    /**
     * Make a path relative
     * @param from
     * @param to
     * @returns {string}
     */
    FSUtils.relative = function (from, to) {
        return path.relative(from, to);
    };
    /**
     * Get all files within a given source path
     * @param srcpath
     * @returns {T[]|string[]}
     */
    FSUtils.getFiles = function (srcpath) {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isFile();
        });
    };
    FSUtils.getAllFilesRecursivelyByType = function (path, expression, dirPrefix) {
        var files = glob.sync(FSUtils.join(path, expression));
        return files.map(function (file) {
            return FSUtils.join(dirPrefix, FSUtils.relative(path, file)).replace(/\\/g, "/");
        });
    };
    FSUtils.getClassifiedFileMap = function (path) {
        var filemap = {
            directories: []
        };
        fs.readdirSync(path).forEach(function (file) {
            var p = FSUtils.join(path, file);
            if (fs.statSync(p).isDirectory()) {
                filemap["directories"].push(file);
            }
            else {
                if (!filemap[FSUtils.classifyFile(p)])
                    filemap[FSUtils.classifyFile(p)] = [];
                filemap[FSUtils.classifyFile(p)].push(file);
            }
        });
        return filemap;
    };
    FSUtils.getFileType = function (path) {
        return mime.lookup(path);
    };
    FSUtils.classifyFile = function (file) {
        var type = FSUtils.getFileType(file);
        var primitiveType = type.split("/")[0];
        switch (primitiveType) {
            case "image":
                break;
            case "video":
                break;
            default:
                primitiveType = "file";
                break;
        }
        return primitiveType;
    };
    /**
     * Load a file from existing path
     */
    FSUtils.loadFile = function (srcpath) {
        try {
            return require(srcpath);
        }
        catch (e) {
            return undefined;
        }
    };
    /**
     * Create a directory
     * @type {string}
     */
    FSUtils.createDirectory = function (path) {
        mkdirp.sync(path);
    };
    /**
     * Remove a file or directory
     * @param path
     */
    FSUtils.remove = function (path) {
        if (fs.statSync(path).isDirectory()) {
            var files = fs.readdirSync(path);
            if (files.length == 0) {
                fs.rmdir(path);
            }
        }
        else {
            fs.unlinkSync(path);
        }
    };
    FSUtils.clearCache = function (cfg, relativePath) {
        var e_1, _a;
        return __awaiter(this, void 0, void 0, function () {
            var dirName, baseNameNoExt, globPath, stream, stream_1, stream_1_1, entry, e_1_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        dirName = path.dirname(relativePath);
                        baseNameNoExt = path.basename(relativePath, path.extname(relativePath));
                        globPath = cfg.cache + dirName + '/**/' + baseNameNoExt + '.*';
                        stream = fg.stream([globPath], { dot: true, absolute: true, concurrency: 1 });
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, 8, 13]);
                        stream_1 = __asyncValues(stream);
                        _b.label = 2;
                    case 2: return [4 /*yield*/, stream_1.next()];
                    case 3:
                        if (!(stream_1_1 = _b.sent(), !stream_1_1.done)) return [3 /*break*/, 6];
                        entry = stream_1_1.value;
                        console.log("Deleting cache file ", entry);
                        return [4 /*yield*/, util_1.promisify(fs.unlink)(entry)];
                    case 4:
                        _b.sent();
                        _b.label = 5;
                    case 5: return [3 /*break*/, 2];
                    case 6: return [3 /*break*/, 13];
                    case 7:
                        e_1_1 = _b.sent();
                        e_1 = { error: e_1_1 };
                        return [3 /*break*/, 13];
                    case 8:
                        _b.trys.push([8, , 11, 12]);
                        if (!(stream_1_1 && !stream_1_1.done && (_a = stream_1.return))) return [3 /*break*/, 10];
                        return [4 /*yield*/, _a.call(stream_1)];
                    case 9:
                        _b.sent();
                        _b.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        if (e_1) throw e_1.error;
                        return [7 /*endfinally*/];
                    case 12: return [7 /*endfinally*/];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    FSUtils.removeImage = function (cfg, relativePath) {
        var absolutePath = cfg.path + relativePath;
        if (fs.statSync(absolutePath).isDirectory()) {
            var files = fs.readdirSync(absolutePath);
            if (files.length == 0) {
                fs.rmdir(absolutePath);
            }
        }
        else {
            fs.unlinkSync(absolutePath);
            FSUtils.clearCache(cfg, relativePath);
        }
    };
    /**
     * Check if path is a file
     */
    FSUtils.isFile = function (path) {
        return fs.statSync(path).isFile();
    };
    /**
     * Join string with system's path like
     * @type {(function(...[any]): string)|(function(...[string]): string)}
     */
    FSUtils.join = path.join;
    /**
     * Get the appropiate separator for the current system
     * @type {string}
     */
    FSUtils.sep = path.sep;
    return FSUtils;
}());
module.exports = FSUtils;
//# sourceMappingURL=FSUtils.js.map