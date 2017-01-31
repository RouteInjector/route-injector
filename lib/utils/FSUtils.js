/**
 * Created by gerard on 1/18/16.
 */
///<reference path='../../typings/index.d.ts'/>
"use strict";
var fs = require("fs");
var path = require("path");
var glob = require("glob");
var FSUtils = (function () {
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
    return FSUtils;
}());
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
module.exports = FSUtils;
//# sourceMappingURL=FSUtils.js.map