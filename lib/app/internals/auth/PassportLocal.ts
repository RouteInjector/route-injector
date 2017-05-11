/**
 * Created by gerard on 1/26/16.
 */
import {Request} from "express";
import {Response} from "express";
import {NextFunction} from "express";

import passport = require('passport');
import Logger = require("../Logger");
import {IAuthConfig} from "./IAuthConfig";

class PassportLocal {
    private static logger = Logger.getLogger();
    private tokens = require('../../../engine/routeinjector/routes/auth/tokens');
    private config;

    //TODO: Use IAuthConfig when defining strategies on a next steps of this refactor
    constructor(config:any) {
        var jwt = require('jsonwebtoken');
        var BearerStrategy = require('passport-http-bearer');
        this.config = config;
        passport.use(new BearerStrategy((token, done) => {
            PassportLocal.logger.trace("Passport authentication");

            var model = this.config['token.magicTokens'][token];
            if (model) {
                PassportLocal.logger.debug("Skipping token auth.");
                return done(null, model);
            }

            if (token == undefined || token == null || token == "") {
                PassportLocal.logger.debug("No token");
                return done(null, false);
            }

            jwt.verify(token, this.config['token.secret'], (unauthorized, decoded) => {
                if (unauthorized) {
                    PassportLocal.logger.debug('Unauthorized');
                    return done(null, false);
                } else {
                    if (this.config.login.stateless) {
                        PassportLocal.logger.trace("Authorized user: ", decoded[this.config.login.key]);
                        return done(null, decoded, {scope: 'all'});
                    } else {
                        PassportLocal.logger.debug(decoded);
                        this.tokens.getUserUid(decoded[this.config.login.key], (err, tokenID)=> {
                            if (err) {
                                PassportLocal.logger.error(err);
                                return done(null, false, {scope: 'all'});
                            }
                            else {
                                this.tokens.findAndUpdate(tokenID, function (done) {/* Safe to ignore this :) */
                                });
                                return done(null, decoded, {scope: 'all'});
                            }

                        });
                    }
                }
            });

        }));
    }

    public static create(config:IAuthConfig) {
        return new PassportLocal(config);
    }

    public getUserIfExists(req:Request, res:Response, next:NextFunction) {
        passport.authenticate('bearer', {session: false}, function (err, user, info) {
            if (err) {
                PassportLocal.logger.error(err);
                return next(err);
            }
            if (user) {
                req.user = user;
            }
            next();
        })(req, res, next);
    }

    public needsValidUser(req:Request, res:Response, next:NextFunction) {
        passport.authenticate('bearer', {session: false}, function (err, user, info) {
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
    }
}

export = PassportLocal;
