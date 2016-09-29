var Q = require('q');
var passport = require('passport');
var tokens = require('./tokens.js');
var BearerStrategy = require('passport-http-bearer');
var injector;
var config;
var log;

//---------------------- BASIC STRATEGY USER "DATABASE" ---------------------------//
var users = [
    {id: 1, username: 'bob', password: 'secret', email: 'bob@example.com'},
    {id: 2, username: 'joe', password: 'birthday', email: 'joe@example.com'}
];

function findByUsername(username, fn) {
    for (var i = 0, len = users.length; i < len; i++) {
        var user = users[i];
        if (user.username === username) {
            return fn(null, user);
        }
    }
    return fn(null, null);
}
//--------------------------------------------------------------------------------//

module.exports = function (injector) {
    log = RouteInjector.log;
    config = injector.config.auth;

    // Passport
    var jwt = require('jsonwebtoken');
    var TokenStrategy = require('./passport-token/strategy');
    //var BasicStrategy = require('passport-http').BasicStrategy;

    //console.log(config);
    //var config = injector.config.auth;
    passport.use(new BearerStrategy(function (token, done) {
        log.debug("Passport authentication");
        var model = config['token.magicTokens'][token];
        if (model) {
            log.debug("Skipping token auth.");
            return done(null, model);
        }

        if (token == undefined || token == null || token == "") {
            log.debug("No token");
            return done(null, false);
        }

        jwt.verify(token, config["token.secret"], function (unauthorized, decoded) {
            if (unauthorized) {
                log.debug('Unauthorized');
                return done(null, false);
            } else {
                if (config.login.stateless) {
                    log.debug("Authorized user: ", decoded[config.login.key]);
                    return done(null, decoded, {scope: 'all'});
                }
                else {
                    log.debug(decoded);
                    tokens.getUserUid(decoded[config.login.key], function (err, tokenID) {
                        if (err) {
                            log.error(err);
                            return done(null, false, {scope: 'all'});
                        }
                        else {
                            tokens.findAndUpdate(tokenID, function (done) {/* Safe to ignore this :) */
                            });
                            return done(null, decoded, {scope: 'all'});
                        }

                    });
                }
            }
        });

    }));
    return passport;
};

/**
 * Adds user information to the request in the specified route. It is used as a node middleware
 * i.e app.get('myPath/recipe', getUserIfExists, needsRouteRole("admin"), myAPIMethod);
 */
module.exports.getUserIfExists = function (req, res, next) {
    //passport.authenticate('token', function (err, user, info) {
    passport.authenticate('bearer', {session: false}, function (err, user, info) {
        if (err) {
            log.error(err);
            return next(err);
        }

        if (user) {
            req.user = user;
        }

        next();
    })(req, res, next);
};

/**
 * Adds user information to the request in the specified route. It is used as a node middleware
 * i.e app.get('myPath/recipe', getUserIfExists, needsRouteRole("admin"), myAPIMethod);
 */
module.exports.needsValidUser = function (req, res, next) {
    passport.authenticate('bearer', {session: false}, function (err, user, info) {
        if (err) {
            log.error("", err);
            return next(err);
        }

        if (user) {
            req.user = user;
        }
        else {
            return res.send(401, 'Unauthorized. Invalid user token');
        }

        next();
    })(req, res, next);
};

///**
// * Checks the role permissions for the specified route. It is used as a node middleware
// * i.e app.get('myPath/recipe', getUserIfExists, needsRouteRole("admin"), myAPIMethod);
// */
//module.exports.needsRouteRole = function (role) {
//    return function (req, res, next) {
//        if (req.user && checkAccess(role, req.user))
//            next();
//        else
//            res.send(401, 'Unauthorized. Invalid route role: ' + req.user.role + " (Required " + role + ")");
//    };
//};
//
///**
// * Checks the role permissions for the current user inside the api core. It is used as a promise
// * i.e. needsRole("admin",req,res).then(allowed, rejected);
// */
//module.exports.needsRole = function (role, req, res) {
//    var defer = Q.defer();
//    log.debug("Checking role: | need: " + role + " | user has: " + req.user.role);
//    if (checkAccess(role, req.user)) {
//        defer.resolve(role);
//    } else {
//        defer.reject("Invalid api role: " + req.user.role + " (Required " + role + ")");
//    }
//
//    return defer.promise;
//};
//
//function checkAccess(role, user) {
//    return (role === user.role || (config.permissions.adminRole && user.role === config.permissions.adminRole))
//}
