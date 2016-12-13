///<reference path='../../../../typings/index.d.ts'/>
"use strict";
var Logger = require("./../Logger");
var ExpressManager = require("./../ExpressManager");
var _ = require("lodash");
/**
 * Permissions Loader loads permissions from config/permissions.js and then it merges with defined permissions per model
 */
var PermissionsLoader = (function () {
    function PermissionsLoader(config, modelsLoader) {
        this.roles = [];
        this.holder = {
            routes: {}
        };
        ExpressManager.logger.trace("Creating PermissionsLoader instance");
        this.config = config;
        this.modelsLoader = modelsLoader;
        this.generatePermissions();
    }
    PermissionsLoader.create = function (config, modelsLoader) {
        return new PermissionsLoader(config, modelsLoader);
    };
    PermissionsLoader.prototype.getRoles = function () {
        return this.roles;
    };
    PermissionsLoader.prototype.getPermisisons = function () {
        return this.holder;
    };
    PermissionsLoader.prototype.getPermissionsByRole = function () {
        return this.processAllPermissionsByRole();
    };
    PermissionsLoader.prototype.generatePermissions = function () {
        ExpressManager.logger.trace("Process Models");
        this.processModels();
        ExpressManager.logger.trace("Assign");
        _.assign(this.holder, this.config.permissions);
        ExpressManager.logger.trace("CProcess Routes");
        this.processRoutes();
    };
    PermissionsLoader.prototype.processModels = function () {
        var _this = this;
        this.modelsLoader.forEachModel(function (Model) {
            PermissionsLoader.logger.trace("Model: %s", Model.modelName);
            var m = Model.injector();
            _this.holder.routes[Model.modelName] = {
                get: _this.addRoles(m.get),
                put: _this.addRoles(m.put),
                post: _this.addRoles(m.post),
                delete: _this.addRoles(m.delete),
                search: _this.addRoles(m.search),
                import: _this.addRoles(m.import),
                export: _this.addRoles(m.export)
            };
        });
    };
    PermissionsLoader.prototype.processRoutes = function () {
        var _this = this;
        var verbs = ['get', 'put', 'post', 'delete', 'search', 'import', 'export'];
        PermissionsLoader.logger.trace("Process Routes:");
        Object.keys(this.holder.routes).forEach(function (route) {
            PermissionsLoader.logger.trace("\t Route: %s", route);
            verbs.forEach(function (verb) {
                PermissionsLoader.logger.trace("\t\t Verb: %s", verb);
                _this.holder.routes[route][verb] = _.union(_this.holder.routes[route][verb], _this.holder.routes[route]["all"]);
                _this.roles = _.union(_this.roles, _this.holder.routes[route][verb]);
            });
        });
    };
    PermissionsLoader.prototype.addRoles = function (r) {
        if (r && r.roles) {
            this.roles = _.union(this.roles, r.roles);
            return r.roles;
        }
        else {
            return undefined;
        }
    };
    PermissionsLoader.prototype.processAllPermissionsByRole = function () {
        var result = {};
        var allModels = Object.keys(this.holder.routes);
        var verbs = ["get", "post", "delete", "search", "put", "export", "import"];
        for (var modelName in this.holder.routes) {
            var model = this.holder.routes[modelName];
            for (var verb in model) {
                if (model.hasOwnProperty(verb)) {
                    var route = model[verb];
                    for (var role in route) {
                        if (route.hasOwnProperty(role)) {
                            var userRole = route[role];
                            if (!result[userRole])
                                result[userRole] = {};
                            if (!result[userRole][modelName])
                                result[userRole][modelName] = {};
                            result[userRole][modelName][verb] = true;
                        }
                    }
                }
            }
        }
        for (var r in this.roles) {
            if (this.roles.hasOwnProperty(r)) {
                var role = this.roles[r];
                for (var m in allModels) {
                    if (allModels.hasOwnProperty(m)) {
                        var model = allModels[m];
                        for (var v in verbs) {
                            var verb = verbs[v];
                            if (this.holder.routes[model][verb].indexOf(role) == -1) {
                                if (!result[role][model]) {
                                    result[role][model] = {};
                                }
                                result[role][model][verb] = false;
                            }
                        }
                    }
                }
            }
        }
        return result;
    };
    return PermissionsLoader;
}());
PermissionsLoader.logger = Logger.getLogger();
module.exports = PermissionsLoader;
//# sourceMappingURL=PermissionsLoader.js.map