"use strict";
var passport = require('passport');
var Logger = require("../Logger");
var PassportLocal = (function () {
    //TODO: Use IAuthConfig when defining strategies on a next steps of this refactor
    function PassportLocal(config) {
        var _this = this;
        this.tokens = require('../../../engine/routeinjector/routes/auth/tokens');
        var jwt = require('jsonwebtoken');
        var BearerStrategy = require('passport-http-bearer');
        this.config = config;
        passport.use(new BearerStrategy(function (token, done) {
            PassportLocal.logger.trace("Passport authentication");
            var model = _this.config['token.magicTokens'][token];
            if (model) {
                PassportLocal.logger.debug("Skipping token auth.");
                return done(null, model);
            }
            if (token == undefined || token == null || token == "") {
                PassportLocal.logger.debug("No token");
                return done(null, false);
            }
            jwt.verify(token, _this.config['token.secret'], function (unauthorized, decoded) {
                if (unauthorized) {
                    PassportLocal.logger.debug('Unauthorized');
                    return done(null, false);
                }
                else {
                    if (_this.config.login.stateless) {
                        PassportLocal.logger.debug("Authorized user: ", decoded[_this.config.login.key]);
                        return done(null, decoded, { scope: 'all' });
                    }
                    else {
                        PassportLocal.logger.debug(decoded);
                        _this.tokens.getUserUid(decoded[_this.config.login.key], function (err, tokenID) {
                            if (err) {
                                PassportLocal.logger.error(err);
                                return done(null, false, { scope: 'all' });
                            }
                            else {
                                _this.tokens.findAndUpdate(tokenID, function (done) {
                                });
                                return done(null, decoded, { scope: 'all' });
                            }
                        });
                    }
                }
            });
        }));
    }
    PassportLocal.create = function (config) {
        return new PassportLocal(config);
    };
    PassportLocal.prototype.getUserIfExists = function (req, res, next) {
        passport.authenticate('bearer', { session: false }, function (err, user, info) {
            if (err) {
                PassportLocal.logger.error(err);
                return next(err);
            }
            if (user) {
                req.user = user;
            }
            next();
        })(req, res, next);
    };
    PassportLocal.prototype.needsValidUser = function (req, res, next) {
        passport.authenticate('bearer', { session: false }, function (err, user, info) {
            if (err) {
                PassportLocal.logger.error(err);
                return next(err);
            }
            if (user) {
                req.user = user;
            }
            else {
                return res.status(401).send('Unauthorized. Invalid user token');
            }
            next();
        })(req, res, next);
    };
    PassportLocal.logger = Logger.getLogger();
    return PassportLocal;
}());
module.exports = PassportLocal;
//# sourceMappingURL=PassportLocal.js.map