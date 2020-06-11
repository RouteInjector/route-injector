/**
 * Created by gerard on 1/18/16.
 */
///<reference path='../../typings/index.d.ts'/>
import fs = require('fs');
import path = require('path');
import glob = require('glob');
import mime = require('mime');
import mkdirp = require('mkdirp');

class FSUtils {

    /**
     * Get the directories from the existing src path
     * @param srcpath
     * @returns {any}
     */
    static getDirectories(srcpath): string[] {
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
    static exists(path): boolean {
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
    static getFiles(srcpath): string[] {
        return fs.readdirSync(srcpath).filter(function (file) {
            return fs.statSync(path.join(srcpath, file)).isFile();
        });
    }

    static getAllFilesRecursivelyByType(path, expression, dirPrefix) {
        let files = glob.sync(FSUtils.join(path, expression));
        return files.map(function(file){
            return FSUtils.join(dirPrefix, FSUtils.relative(path, file)).replace(/\\/g, "/");
        });
    }

    static getClassifiedFileMap(path) {
        let filemap = {
            directories: []
        };
        fs.readdirSync(path).forEach(function (file) {
            let p = FSUtils.join(path, file);
            if (fs.statSync(p).isDirectory()) {
                filemap["directories"].push(file);
            } else {
                if (!filemap[FSUtils.classifyFile(p)])
                    filemap[FSUtils.classifyFile(p)] = [];
                filemap[FSUtils.classifyFile(p)].push(file);
            }
        });
        return filemap;
    }

    private static getFileType(path): string {
        return mime.lookup(path);
    }

    private static classifyFile(file): string {
        let type = FSUtils.getFileType(file);
        let primitiveType = type.split("/")[0];
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
    }

    /**
     * Get the appropiate separator for the current system
     * @type {string}
     */
    static sep = path.sep;

    /**
     * Load a file from existing path
     */
    static loadFile(srcpath: string): any {
        try {
            return require(srcpath);
        } catch (e) {
            return undefined;
        }
    }

    /**
     * Create a directory
     * @type {string}
     */
    static createDirectory(path) {
        mkdirp.sync(path);
    }

    /**
     * Remove a file or directory
     * @param path
     */
    static remove(path) {
        if (fs.statSync(path).isDirectory()) {
            let files = fs.readdirSync(path);
            if (files.length == 0) {
                fs.rmdir(path);
            }
        } else {
            fs.unlinkSync(path);
        }
    }

    static clearCache(cfg, relativePath) {

        let dirName = path.dirname(relativePath);
        let baseNameNoExt = path.basename(relativePath, path.extname(relativePath));

        let globPath = cfg.cache + dirName + '/**/' + baseNameNoExt + '.*';

        glob(globPath, function (err, files) {
            if (err) return console.error(err);
            for (var i = 0; i < files.length; i++) {
                console.log("Deleting cache file ", files[i]);
                fs.unlinkSync(files[i]);
            }
        });
    }

    static removeImage(cfg, relativePath) {
        let absolutePath = cfg.path + relativePath;

        if (fs.statSync(absolutePath).isDirectory()) {
            let files = fs.readdirSync(absolutePath);
            if (files.length == 0) {
                fs.rmdir(absolutePath);
            }
        } else {
            fs.unlinkSync(absolutePath);
            FSUtils.clearCache(cfg, relativePath);
        }
    }

    /**
     * Check if path is a file
     */
    static isFile(path) {
        return fs.statSync(path).isFile();
    }
}
export = FSUtils;
