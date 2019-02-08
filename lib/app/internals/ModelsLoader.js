"use strict";
///<reference path='../../../typings/index.d.ts'/>
var FSUtils = require("../../utils/FSUtils");
var mongoose = require("mongoose");
var Logger = require("./Logger");
var ModelsLoader = /** @class */ (function () {
    function ModelsLoader(config, pluginRegistry) {
        this._models = {};
        ModelsLoader.logger.trace("Creating ModelsLoader instance");
        this.config = config;
        this.pluginRegistry = pluginRegistry;
    }
    ModelsLoader.create = function (config, pluginRegistry) {
        return new ModelsLoader(config, pluginRegistry);
    };
    /**
     * Load Project Schemas
     */
    ModelsLoader.prototype.loadProjectSchemas = function () {
        ModelsLoader.logger.debug("Loading Project Schemas");
        var appPath = this.config.appPath;
        var projectModelsDir = FSUtils.join(appPath, 'models');
        this.loadSchemas(projectModelsDir);
        ModelsLoader.logger.debug("");
    };
    /**
     * Load Plugin Schemas
     */
    ModelsLoader.prototype.loadPluginSchemas = function () {
        var _this = this;
        ModelsLoader.logger.debug("Loading Plugin Schemas");
        var plugins = this.pluginRegistry.getPluginNames();
        plugins.forEach(function (plugin) {
            var pluginDir = FSUtils.getModulePath(plugin);
            var pluginModelsDir = FSUtils.join(pluginDir, 'models');
            _this.loadSchemas(pluginModelsDir);
        });
        ModelsLoader.logger.debug("");
    };
    /**
     * For each plugin, call the function modifySchemaFromModel and pass the modelName and the schema of the model
     */
    ModelsLoader.prototype.modifySchemasWithPlugins = function () {
        var _this = this;
        ModelsLoader.logger.debug("Modifying schema with Plugins");
        var modelsNames = Object.keys(this.models);
        var plugins = this.pluginRegistry.getPluginNames();
        modelsNames.forEach(function (modelName) {
            ModelsLoader.logger.debug("\t %s", modelName);
            plugins.forEach(function (pluginName) {
                ModelsLoader.logger.debug("\t\t Calling %s", pluginName);
                var plugin = _this.pluginRegistry.getPlugin(pluginName).plugin;
                if (plugin.modifySchemaFromModel) {
                    plugin.modifySchemaFromModel(modelName, _this.models[modelName].schema);
                }
            });
        });
        ModelsLoader.logger.debug("");
    };
    ModelsLoader.prototype.compileSchemasToModels = function () {
        var _this = this;
        ModelsLoader.logger.debug("Compiling Schemas to Mongoose Models");
        var keys = Object.keys(this.models);
        keys.forEach(function (modelName) {
            ModelsLoader.logger.debug("\t %s", modelName);
            var collection = undefined;
            if (_this.models[modelName].collectionName) {
                collection = _this.models[modelName].collectionName;
            }
            if (_this.models[modelName].baseModel) {
                var baseModel = _this.models[modelName].baseModel;
                var baseModelObject = mongoose.model(baseModel, _this.models[baseModel].schema, collection);
                _this.models[baseModel] = baseModelObject;
                _this.models[modelName] = baseModelObject.discriminator(modelName, _this.models[modelName].schema);
            }
            else {
                _this.models[modelName] = mongoose.model(modelName, _this.models[modelName].schema, collection);
            }
        });
        ModelsLoader.logger.debug("");
    };
    /**
     * Iterate through the directories of {srcpath} and if it's a valid Model, it will cache
     * @param srcpath
     */
    ModelsLoader.prototype.loadSchemas = function (srcpath) {
        var _this = this;
        var dirs = FSUtils.getDirectories(srcpath);
        dirs.forEach(function (dir) {
            ModelsLoader.logger.debug("\t %s", dir);
            var Model = require(FSUtils.join(srcpath, dir));
            if (Model.modelName && Model.schema) {
                if (!_this.isModelRestricted(Model.modelName)) {
                    ModelsLoader.logger.trace("\t\t ModelName: %s -- ", Model.modelName);
                    _this.models[Model.modelName] = Model;
                }
                else {
                    ModelsLoader.logger.debug("\t\t %s is restricted and it will not be loaded", Model.modelName);
                }
            }
            else {
                ModelsLoader.logger.warn("\t\t %s directory is being ignored because modelName and schema are not present", dir);
            }
        });
    };
    ModelsLoader.prototype.loadModels = function () {
        this.loadProjectSchemas();
        this.loadPluginSchemas();
        this.modifySchemasWithPlugins();
        this.compileSchemasToModels();
    };
    Object.defineProperty(ModelsLoader.prototype, "models", {
        get: function () {
            return this._models;
        },
        enumerable: true,
        configurable: true
    });
    ModelsLoader.prototype.forEachModel = function (callback) {
        var _this = this;
        var modelKeys = Object.keys(this.models);
        modelKeys.forEach(function (modelName) {
            callback(_this.models[modelName]);
        });
    };
    /**
     * This function is used to restrict or not a Model load
     * @param modelName
     * @returns {boolean}
     */
    ModelsLoader.prototype.isModelRestricted = function (modelName) {
        var restrictions = this.config.env.restrictions;
        if (restrictions && restrictions.blacklist && restrictions.blacklist.models && restrictions.blacklist.models.indexOf(modelName) > -1)
            return true;
        if (restrictions && restrictions.whitelist && restrictions.whitelist.models && restrictions.whitelist.models.indexOf(modelName) == -1)
            return true;
        return false;
    };
    ModelsLoader.logger = Logger.getLogger();
    return ModelsLoader;
}());
module.exports = ModelsLoader;
//# sourceMappingURL=ModelsLoader.js.map