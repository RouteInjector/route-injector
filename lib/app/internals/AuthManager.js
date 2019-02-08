"use strict";
///<reference path='../../../typings/index.d.ts'/>
var PassportLocal = require("./auth/PassportLocal");
var Unauthorized = require("../../responses/Unauthorized");
var PermissionsLoader = require("./auth/PermissionsLoader");
var AuthManager = /** @class */ (function () {
    function AuthManager(config, models) {
        var _this = this;
        this.checkRole = function (role) { return ({
            name: 'checkRole(' + role + ')',
            middleware: function (req, res, next) {
                _this.auth(req, res, function () {
                    if (_this.isRoleAcceptable(role, req.user)) {
                        return next();
                    }
                    else {
                        return next(new Unauthorized("Unauthorized. User role is " + req.user.role + " and this operation needs " + role));
                    }
                });
            }
        }); };
        this.pUrlTokenToHeader = function () { return ({
            name: 'urlTokenToHeader',
            middleware: function (req, res, next) {
                if (req.query.token) {
                    req.headers['authorization'] = 'BEARER ' + req.query.token;
                }
                return next();
            }
        }); };
        this.urlTokenToHeader = this.pUrlTokenToHeader();
        this.pGetUserIfExists = function () { return ({
            name: 'getUserIfExists',
            middleware: function (req, res, next) {
                if (req.user) {
                    next();
                }
                else {
                    _this.passportLocal.getUserIfExists(req, res, next);
                }
            }
        }); };
        this.getUserIfExists = this.pGetUserIfExists();
        this.passportLocal = PassportLocal.create(config.auth);
        this.config = config;
        this.models = models;
    }
    AuthManager.prototype.loadAuth = function () {
        var permissionsLoader = PermissionsLoader.create(this.config, this.models);
        this.roles = permissionsLoader.getRoles();
        this.permissions = permissionsLoader.getPermisisons();
        this.permissionsByRole = permissionsLoader.getPermissionsByRole();
    };
    AuthManager.create = function (config, models) {
        return new AuthManager(config, models);
    };
    AuthManager.prototype.auth = function (req, res, next) {
        if (req.user) {
            next();
        }
        else {
            this.passportLocal.needsValidUser(req, res, next);
        }
    };
    AuthManager.prototype.isRoleAcceptable = function (role, user) {
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
            }
            else {
                if (role != user.role) {
                    return false;
                }
            }
        }
        return true;
    };
    return AuthManager;
}());
module.exports = AuthManager;
//# sourceMappingURL=AuthManager.js.map