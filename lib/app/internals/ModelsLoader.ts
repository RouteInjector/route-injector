///<reference path='../../../typings/index.d.ts'/>

import FSUtils =require('../../utils/FSUtils');
import mongoose = require('mongoose');
import PluginRegistry = require("./PluginRegistry");
import RouteInjector = require("../RouteInjector");
import Logger = require("./Logger");
import Configurations = require("./Configurations");
import {Model} from "mongoose";

class ModelsLoader {
    private static logger = Logger.getLogger();
    private config: Configurations;
    private pluginRegistry;

    private _models: any = {};

    constructor(config: Configurations, pluginRegistry: PluginRegistry) {
        ModelsLoader.logger.trace("Creating ModelsLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }

    public static create(config: Configurations, pluginRegistry: PluginRegistry) {
        return new ModelsLoader(config, pluginRegistry);
    }

    /**
     * Load Project Schemas
     */
    public loadProjectSchemas() {
        ModelsLoader.logger.debug("Loading Project Schemas");
        var appPath = this.config.appPath;
        var projectModelsDir = FSUtils.join(appPath, 'models');
        this.loadSchemas(projectModelsDir);
        ModelsLoader.logger.debug("");
    }

    /**
     * Load Plugin Schemas
     */
    public loadPluginSchemas() {
        ModelsLoader.logger.debug("Loading Plugin Schemas");
        var plugins: string[] = this.pluginRegistry.getPluginNames();
        plugins.forEach((plugin) => {
            var pluginDir = FSUtils.getModulePath(plugin);
            var pluginModelsDir = FSUtils.join(pluginDir, 'models');
            this.loadSchemas(pluginModelsDir);
        });
        ModelsLoader.logger.debug("");
    }

    /**
     * For each plugin, call the function modifySchemaFromModel and pass the modelName and the schema of the model
     */
    public modifySchemasWithPlugins() {
        ModelsLoader.logger.debug("Modifying schema with Plugins");
        var modelsNames: string[] = Object.keys(this.models);
        var plugins: string[] = this.pluginRegistry.getPluginNames();

        modelsNames.forEach((modelName) => {
            ModelsLoader.logger.debug("\t %s", modelName);
            plugins.forEach((pluginName) => {
                ModelsLoader.logger.debug("\t\t Calling %s", pluginName);
                var plugin = this.pluginRegistry.getPlugin(pluginName).plugin;
                if (plugin.modifySchemaFromModel) {
                    plugin.modifySchemaFromModel(modelName, this.models[modelName].schema);
                }
            });
        });
        ModelsLoader.logger.debug("");
    }

    public compileSchemasToModels() {
        ModelsLoader.logger.debug("Compiling Schemas to Mongoose Models");
        var keys = Object.keys(this.models);
        keys.forEach((modelName) => {
            ModelsLoader.logger.debug("\t %s", modelName);

            var collection = undefined;
            if (this.models[modelName].collectionName) {
                collection = this.models[modelName].collectionName;
            }

            if (this.models[modelName].baseModel) {
                var baseModel = this.models[modelName].baseModel;
                var baseModelObject = mongoose.model(baseModel, this.models[baseModel].schema, collection);
                this.models[baseModel] = baseModelObject;
                this.models[modelName] = baseModelObject.discriminator(modelName, this.models[modelName].schema);
            } else {
                this.models[modelName] = mongoose.model(modelName, this.models[modelName].schema, collection);
            }
        });
        ModelsLoader.logger.debug("");
    }

    /**
     * Iterate through the directories of {srcpath} and if it's a valid Model, it will cache
     * @param srcpath
     */
    private loadSchemas(srcpath) {
        var dirs: string[] = FSUtils.getDirectories(srcpath);
        dirs.forEach((dir) => {
            ModelsLoader.logger.debug("\t %s", dir);
            var Model = require(FSUtils.join(srcpath, dir));
            if (Model.modelName && Model.schema) {
                if (!this.isModelRestricted(Model.modelName)) {
                    ModelsLoader.logger.trace("\t\t ModelName: %s -- ", Model.modelName);
                    this.models[Model.modelName] = Model;
                } else {
                    ModelsLoader.logger.debug("\t\t %s is restricted and it will not be loaded", Model.modelName);
                }
            } else {
                ModelsLoader.logger.warn("\t\t %s directory is being ignored because modelName and schema are not present", dir);
            }
        });
    }

    public loadModels(): void {
        this.loadProjectSchemas();
        this.loadPluginSchemas();
        this.modifySchemasWithPlugins();
        this.compileSchemasToModels();
    }

    get models() {
        return this._models;
    }

    public forEachModel(callback: (model) => void) {
        var modelKeys = Object.keys(this.models);
        modelKeys.forEach((modelName) => {
            callback(this.models[modelName]);
        });
    }

    /**
     * This function is used to restrict or not a Model load
     * @param modelName
     * @returns {boolean}
     */
    private isModelRestricted(modelName) {
        var restrictions = this.config.env.restrictions;
        if (restrictions && restrictions.blacklist && restrictions.blacklist.models && restrictions.blacklist.models.indexOf(modelName) > -1)
            return true;
        if (restrictions && restrictions.whitelist && restrictions.whitelist.models && restrictions.whitelist.models.indexOf(modelName) == -1)
            return true;
        return false;
    }


}
export = ModelsLoader;
