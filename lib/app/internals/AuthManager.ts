///<reference path='../../../typings/index.d.ts'/>

import PassportLocal = require("./auth/PassportLocal");
import {IAuthConfig} from "./auth/IAuthConfig";
import Configurations = require("./Configurations");
import MiddlewareRegistry = require("./MiddlewareRegistry");
import Unauthorized = require("../../responses/Unauthorized");
import PermissionsLoader = require("./auth/PermissionsLoader");
import ModelsLoader = require("./ModelsLoader");

class AuthManager {

    private passportLocal:PassportLocal;
    private config:Configurations;
    private models:ModelsLoader;

    public roles;
    public permissions;
    public permissionsByRole;

    constructor(config:Configurations, models:ModelsLoader) {
        this.passportLocal = PassportLocal.create(config.auth);
        this.config = config;
        this.models = models;
    }

    public loadAuth() {
        var permissionsLoader = PermissionsLoader.create(this.config, this.models);
        this.roles = permissionsLoader.getRoles();
        this.permissions = permissionsLoader.getPermisisons();
        this.permissionsByRole = permissionsLoader.getPermissionsByRole();
    }

    public static create(config:Configurations, models:ModelsLoader) {
        return new AuthManager(config, models);
    }

    public auth(req, res, next) {
        if (req.user) {
            next();
        } else {
            this.passportLocal.needsValidUser(req, res, next);
        }
    }

    public checkRole = (role:string) => ({
        name: 'checkRole(' + role + ')',
        middleware: (req, res, next)=> {
            this.auth(req, res, () => {
                if (this.isRoleAcceptable(role, req.user)) {
                    return next();
                } else {
                    return next(new Unauthorized("Unauthorized. User role is " + req.user.role + " and this operation needs " + role));
                }
            });
        }
    });

    private pUrlTokenToHeader = () =>({
        name: 'urlTokenToHeader',
        middleware: (req, res, next) => {
            if (req.query.token) {
                req.headers['authorization'] = 'BEARER ' + req.query.token;
            }
            return next();
        }
    });
    public urlTokenToHeader = this.pUrlTokenToHeader();

    private pGetUserIfExists = () => ({
        name: 'getUserIfExists',
        middleware: (req, res, next) => {
            if (req.user) {
                next();
            } else {
                this.passportLocal.getUserIfExists(req, res, next);
            }
        }
    });

    public getUserIfExists = this.pGetUserIfExists();


    private isRoleAcceptable(role, user) {
        var config = this.config;
        var restrictions = this.config.env.restrictions;
        if (config.permissions.adminRole && user.role == config.permissions.adminRole) {
            return true;
        }

        if (restrictions && restrictions.blacklist && restrictions.blacklist.roles && restrictions.blacklist.roles.indexOf(user.role) > -1)
            return false;

        if (restrictions && restrictions.whitelist && restrictions.whitelist.roles && restrictions.whitelist.roles.indexOf(user.role) == -1)
            return false;

        if (role) {
            if (role instanceof Array) {
                if (role.indexOf(user.role) == -1) {
                    return false;
                }
            } else {
                if (role != user.role) {
                    return false;
                }
            }
        }
        return true;
    }


}

export = AuthManager;