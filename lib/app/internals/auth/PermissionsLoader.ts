///<reference path='../../../../typings/index.d.ts'/>

import ModelsLoader = require("./../ModelsLoader");
import Logger = require("./../Logger");
import ExpressManager = require("./../ExpressManager");
import _ = require("lodash");
import Configurations = require("./../Configurations");

/**
 * Permissions Loader loads permissions from config/permissions.js and then it merges with defined permissions per model
 */
class PermissionsLoader {
    private static logger = Logger.getLogger();
    private config:Configurations;
    private modelsLoader:ModelsLoader;

    public roles:string[] = [];
    private holder = {
        routes: {}
    };

    constructor(config:Configurations, modelsLoader:ModelsLoader) {
        ExpressManager.logger.trace("Creating PermissionsLoader instance");
        this.config = config;
        this.modelsLoader = modelsLoader;

        this.generatePermissions();
    }

    public static create(config:Configurations, modelsLoader:ModelsLoader) {
        return new PermissionsLoader(config, modelsLoader);
    }

    public getRoles() {
        return this.roles;
    }

    public getPermisisons() {
        return this.holder;
    }

    public getPermissionsByRole() {
        return this.processAllPermissionsByRole();
    }

    private generatePermissions() {

        ExpressManager.logger.trace("Process Models");
        this.processModels();

        ExpressManager.logger.trace("Assign");
        _.assign(this.holder, this.config.permissions);


        ExpressManager.logger.trace("CProcess Routes");
        this.processRoutes();
    }

    private processModels() {
        this.modelsLoader.forEachModel((Model)=> {
            PermissionsLoader.logger.trace("Model: %s", Model.modelName);
            var m = Model.injector();
            this.holder.routes[Model.modelName] = {
                get: this.addRoles(m.get),
                put: this.addRoles(m.put),
                post: this.addRoles(m.post),
                delete: this.addRoles(m.delete),
                search: this.addRoles(m.search),
                import: this.addRoles(m.import),
                export: this.addRoles(m.export)
            }
        });
    }

    private processRoutes() {
        var verbs = ['get', 'put', 'post', 'delete', 'search', 'import', 'export'];
        PermissionsLoader.logger.trace("Process Routes:")
        Object.keys(this.holder.routes).forEach((route)=> {
            PermissionsLoader.logger.trace("\t Route: %s", route);
            verbs.forEach((verb)=> {
                PermissionsLoader.logger.trace("\t\t Verb: %s", verb);
                this.holder.routes[route][verb] = _.union(this.holder.routes[route][verb], this.holder.routes[route]["all"]);
                this.roles = _.union(this.roles, this.holder.routes[route][verb]);
            });
        });
    }

    private addRoles(r):string[] {
        if (r && r.roles) {
            this.roles = _.union(this.roles, r.roles);
            return r.roles;
        } else {
            return undefined;
        }
    }

    private processAllPermissionsByRole() {
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
                var role:any = this.roles[r];

                for (var m in allModels) {
                    if(allModels.hasOwnProperty(m)) {
                        var model:any = allModels[m];
                        for (var v in verbs) {
                            var verb:any = verbs[v];
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
    }
}
export = PermissionsLoader;