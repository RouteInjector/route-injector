/**
 * Created by gerard on 1/18/16.
 */
///<reference path='../typings/index.d.ts'/>

import fs = require('fs');
import path = require('path');
import glob = require('glob');

class FSUtils {

    /**
     * Get the directories from the existing src path
     * @param srcpath
     * @returns {any}
     */
    static getDirectories(srcpath):string[] {
        if (fs.existsSync(srcpath)) {
            return fs.readdirSync(srcpath).filter(function (file) {
                return fs.statSync(path.join(srcpath, file)).isDirectory();
            });
        } else {
            return [];
        }
    }

    /**
     * Get path from a module
     *
     * @param module
     * @returns {string}
     */
    static getModulePath(module) {
        return path.dirname(require.resolve(module));
    }

    /**
     * Check if a directory or a file exists
     * @param path
     * @returns {boolean}
     */
    static exists(path):boolean {
        return fs.existsSync(path);
    }

    /**
     * Make a path relative
     * @param from
     * @param to
     * @returns {string}
     */
    static relative(from, to) {
        return path.relative(from, to);
    }

    /**
     * Join string with system's path like
     * @type {(function(...[any]): string)|(function(...[string]): string)}
     */
    static join = path.join;

    /**
     * Get all files within a given source path
     * @param srcpath
     * @returns {T[]|string[]}
     */
    static getFiles(srcpath):string[] {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isFile();
        });
    }

    static getAllFilesRecursivelyByType(path, expression, dirPrefix){
        var files = glob.sync(FSUtils.join(path, expression));
        return files.map(function(file){
            return FSUtils.join(dirPrefix, FSUtils.relative(path, file)).replace(/\\/g,'/');
        });
    }

    /**
     * Get the appropiate separator for the current system
     * @type {string}
     */
    static sep = path.sep;

    /**
     * Load a file from existing path
     */
    static loadFile(srcpath:string):any {
        try {
            return require(srcpath);
        } catch (e) {
            return undefined;
        }
    }
}
export = FSUtils;