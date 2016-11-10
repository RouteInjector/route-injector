///<reference path='../../../typings/index.d.ts' />

import Logger = require("./Logger");
import FSUtils = require("../../utils/FSUtils");
import _ = require("lodash");
/**
 * Created by gerard on 1/20/16.
 */
class Configurations {
    private static logger = Logger.getLogger();
    private static configHolder = null;
    private static CONFIG_PATH = 'config';
    private static CONFIG_FILES = ['application', 'auth', 'session', 'swagger', 'globals', 'routes', 'backoffice', "bootstrap", "permissions", "express"];

    private processEnv;

    public appPath;
    public env;
    public application;
    public auth;
    public session;
    public swagger;
    public globals;
    public routes;
    public backoffce;
    public bootstrap;
    public permissions;
    public express;

    constructor() {
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

    public static instance():Configurations {
        if (this.configHolder == null) {
            this.configHolder = new Configurations();
        }
        return this.configHolder;
    }

    private loadEnvFile(env:string) {
        Configurations.logger.info("Environment: %s", env);
        this.env = require(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, 'env', env));
    }

    private loadConfigFiles() {
        Configurations.logger.info("Loading config files:");
        Configurations.CONFIG_FILES.forEach((file) => {
            this[file] = this.loadConfig(file);
            if (this[file]) {
                Configurations.logger.info("\t %s.js", file);
            } else {
                Configurations.logger.warn("\t > %s.js could not be loaded", file);
            }
        });
    }

    private loadConfig(file) {
        var originalConfig = FSUtils.loadFile(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, file));
        var envConfig = FSUtils.loadFile(FSUtils.join(this.appPath, Configurations.CONFIG_PATH, file + '.e', this.processEnv));
        _.merge(originalConfig, envConfig);
        return originalConfig;
    }

}
export = Configurations;