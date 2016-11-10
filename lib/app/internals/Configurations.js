///<reference path='../../../typings/index.d.ts' />
"use strict";
var Logger = require("./Logger");
var FSUtils = require("../../utils/FSUtils");
var _ = require("lodash");
/**
 * Created by gerard on 1/20/16.
 */
var Configurations = (function () {
    function Configurations() {
        if (Configurations.configHolder) {
            throw new Error("Don't instantiate directly a configuration");
        }
        Configurations.logger.trace("Creating Configurations instance");
        this.appPath = process.cwd();
        this.processEnv = process.env.RI_ENV || process.env.NODE_ENV || 'development';
        this.loadEnvFile(this.processEnv);
        this.loadConfigFiles();
        Configurations.logger.info("");
        var level = this.env.logger && this.env.logger.level ? this.env.logger.level : 'info';
        Logger.setLevel(level);
        Logger.setName(this.application.name);
    }
    Configurations.instance = function () {
        if (this.configHolder == null) {
            this.configHolder = new Configurations();
        }
        return this.configHolder;
    };
    Configurations.prototype.loadEnvFile = function (env) {
        Configurations.logger.info("Environment: %s", env);
        this.env = require(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, 'env', env));
    };
    Configurations.prototype.loadConfigFiles = function () {
        var _this = this;
        Configurations.logger.info("Loading config files:");
        Configurations.CONFIG_FILES.forEach(function (file) {
            _this[file] = _this.loadConfig(file);
            if (_this[file]) {
                Configurations.logger.info("\t %s.js", file);
            }
            else {
                Configurations.logger.warn("\t > %s.js could not be loaded", file);
            }
        });
    };
    Configurations.prototype.loadConfig = function (file) {
        var originalConfig = FSUtils.loadFile(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, file));
        var envConfig = FSUtils.loadFile(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, file + '.e', this.processEnv));
        _.merge(originalConfig, envConfig);
        return originalConfig;
    };
    Configurations.logger = Logger.getLogger();
    Configurations.configHolder = null;
    Configurations.CONFIG_PATH = 'config';
    Configurations.CONFIG_FILES = ['application', 'auth', 'session', 'swagger', 'globals', 'routes', 'backoffice', "bootstrap", "permissions", "express"];
    return Configurations;
}());
module.exports = Configurations;
//# sourceMappingURL=Configurations.js.map