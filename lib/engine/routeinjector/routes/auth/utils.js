var statusCode = require('statusCode');
var passportLocal = require('./passport-local');

module.exports.auth = function (req, res, next) {
    if (req.user) {
        next();
    } else {
        passportLocal.needsValidUser(req, res, next);
    }
};

function getUserIfExists(req, res, next) {
    if (req.user) {
        next();
    } else {
        passportLocal.getUserIfExists(req, res, next);
    }
}

function checkRole(role) {

    return function (req, res, next) {
        var injector = require('../../../../');
        var config = injector.config;
        var env = config.env;
        var restrictions = env.restrictions;

        module.exports.auth(req, res, function () {
            if (config.permissions.adminRole && req.user.role == config.permissions.adminRole) {
                return next();
            }

            if (restrictions && restrictions.blacklist && restrictions.blacklist.roles && restrictions.blacklist.roles.indexOf(req.user.role) > -1)
                return kick();

            if (restrictions && restrictions.whitelist && restrictions.whitelist.roles && restrictions.whitelist.roles.indexOf(req.user.role) == -1)
                return kick();

            if (role) {
                if (role instanceof Array) {
                    if (role.indexOf(req.user.role) == -1) {
                        return kick();
                    }
                } else {
                    if (role != req.user.role) {
                        return kick();
                    }
                }
            } else {
                return next();
            }

            function kick() {
                res.statusCode = statusCode.Unauthorized();
                res.json("Unauthorized. User role is " + req.user.role + " and this operation needs " + role);
                return res.end();
            }

            next();
        });
    }
}


module.exports.checkRole = function (role) {
    return {
        name: "checkRole(" + role + ")",
        middleware: checkRole(role)
    }
};
module.exports.getUserIfExists = {
    name: "getUserIfExists",
    middleware: getUserIfExists
};