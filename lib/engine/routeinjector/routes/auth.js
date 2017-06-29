var statusCode = require('http-status-codes');
var tokens = require('./auth/tokens');
var jwt = require('jsonwebtoken');
var _ = require('lodash-contrib');
var async = require('async');
var injector  = require('../../..');
var mongoose = injector.mongoose;
var log = injector.log;
var aconf = injector.config.auth;

//TODO Dual key, i.e login y mail
//TODO Callback cuando se autentique poder hacer cosas raras tipo el login de Eric en MyCook
//TODO Relacionado: como se saca el rol del User
//TODO Juntar las expiraciones de token: token.expiresInMinutes & token.logoutInMillis
exports.login = function (req, res) {
    var loginValue = req.body.login;
    var hash = req.body.password;
    var token = req.body.token;

    var loginInfo = {};

    if(token && !hash){
        req.params.token = token;
        exports.checkToken(req, res, function(valid){
            if(valid) {
                res.statusCode = statusCode.OK;
                var r = {token: token};
                _.extend(r, valid);
                res.json(r);
                return res.end();
            } else {
                res.statusCode = statusCode.UNAUTHORIZED;
                return res.end();
            }
        });
    } else{
        auth();
    }


    function auth() {
        if (aconf.login.function) {
            aconf.login.function(req, loginValue, hash, function (code, err, login) {
                res.statusCode = code;
                if (err) {
                    log.info("Login failed", err);
                    res.json(err);
                    return res.end();
                } else {
                    var data = _(login).pick(aconf["token.fields"]).value();
                    sign(data, login);
                    res.json(loginInfo.json);
                    return res.end();
                }
            });
        } else {
            var loginCondition = {};
            loginCondition[aconf.login.key] = loginValue;
            async.eachSeries(aconf.login.model, function (LoginModel, cbk) {
                doLogin(mongoose.model(LoginModel), cbk);
            }, function (err) {
                // on complete
                res.statusCode = loginInfo.statusCode;
                res.json(loginInfo.json);
                return res.end();
            });
        }
    }

    function doLogin(model, cbk) {
        if (loginInfo.found == undefined) {
            model.findOne(loginCondition, null).lean().exec(function (err, result) {
                //var logModels = config.login.model;
                if (err) {
                    loginInfo.statusCode = statusCode.INTERNAL_SERVER_ERROR;
                    log.error(err);
                    cbk();
                } else {
                    if (result == null) {
                        log.debug("User not found");
                        loginInfo.statusCode = statusCode.NOT_FOUND;
                        loginInfo.json = {error: "User not found"};
                    } else if (md5(hash) != result[aconf.login.password]) {
                        log.debug("Incorrect username or password");
                        loginInfo.statusCode = statusCode.METHOD_NOT_ALLOWED;
                        loginInfo.json = {error: "Incorrect username or password"};
                    } else {
                        var data = _(result).pick(aconf["token.fields"]).value();
                        if (config.login.stateless) {
                            sign(data, result, model);
                        } else {
                            tokens.newToken({user: result[aconf.login.key]}, function (err, tokenID) {
                                _.extend(data, {uid: tokenID});
                                sign(data, result, model);
                            });
                        }
                    }
                    cbk();
                }
            });

        } else {
            cbk();
        }
    }

    function sign(data, result, model) {
        var token = jwt.sign(data, aconf["token.secret"], {expiresIn: aconf["token.expiresInMinutes"]});
        loginInfo.statusCode = statusCode.OK;
        var response = _(result).pick(aconf["token.publicFields"]).extend({token: token}).value();
        loginInfo.json = response;
        loginInfo.found = 1;
    }

};

exports.getLogin = function (req, res) {
    req.body = {};
    req.body.login = req.params.login;
    req.body.password = req.params.hash;
    return exports.login(req, res);
};

exports.logout = function (req, res) {
    log.info(req.user);
    if (aconf.login.stateless) {
        res.statusCode = statusCode.BAD_REQUEST;
        res.json({result: 'auth mode is stateless'});
        res.end();
    } else {
        if (req.query.token && req.user) {

            tokens.getUserUid(req.user[aconf.login.key], function (err, tokenID) {
                if (err) {
                    res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
                    res.json(err);
                    return res.end();
                }

                tokens.remove(tokenID, function (err) {
                    if (err) {
                        res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
                        res.json(err);
                        return res.end();
                    }
                    res.statusCode = statusCode.OK;
                    res.json({result: 'log out'});
                    res.end();
                });
            });
        } else {
            res.statusCode = statusCode.NOT_FOUND;
            res.json({result: 'no token specified'});
            res.end();
        }
    }
};

exports.checkToken = function (req, res, cb) {
    var token = req.params.token;
    jwt.verify(token, aconf["token.secret"], function (unauthorized, decoded) {
        if (unauthorized) {
            if(cb) return cb(false);

            var result = { result: 'Invalid or expired token'};
            res.statusCode = statusCode.NOT_FOUND;
            res.json(result);
            res.end();
        } else {
            if (aconf.login.stateless) {
                if(cb) return cb(decoded);

                res.statusCode = statusCode.OK;
                res.json(decoded);
                res.end();
            } else {
                tokens.findAndUpdate(decoded.uid, function (err, result) {
                    if (result != null) {
                        if(cb) return cb(decoded);
                        res.statusCode = statusCode.OK;
                        res.json(decoded);
                        res.end();
                    } else {
                        if(cb) return cb(decoded);
                        var result = { result: 'Invalid or expired token'};
                        res.statusCode = statusCode.NOT_FOUND;
                        res.json(result);
                        res.end();
                    }
                });
            }
        }
    });
};
