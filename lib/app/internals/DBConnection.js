"use strict";
/**
 * Created by gerard on 1/15/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var Logger = require("./Logger");
var mongoose = require("mongoose");
var DBConnection = (function () {
    function DBConnection(config) {
        DBConnection.logger.trace("Creating DBConnection instance");
        this.config = config;
        this.debug(this.config.env.database.debug || false);
    }
    DBConnection.create = function (config) {
        return new DBConnection(config);
    };
    DBConnection.prototype.debug = function (bool) {
        mongoose.set('debug', bool);
    };
    DBConnection.prototype.connect = function (cb) {
        var _this = this;
        var db = mongoose.connection;
        db.on('error', function (err) {
            DBConnection.logger.error("Mongo Error (" + _this.config.env.database.endpoint + '/' + _this.config.env.database.name + ")", err);
        });
        db.once('open', function () {
            DBConnection.logger.info('');
            DBConnection.logger.info('Mongo is UP (' + _this.config.env.database.endpoint + '/' + _this.config.env.database.name + ')');
            DBConnection.logger.info('');
            cb();
        });
        mongoose.connect('mongodb://' + this.config.env.database.endpoint + '/' + this.config.env.database.name);
    };
    Object.defineProperty(DBConnection.prototype, "mongoose", {
        get: function () {
            return mongoose;
        },
        enumerable: true,
        configurable: true
    });
    DBConnection.logger = Logger.getLogger();
    return DBConnection;
}());
module.exports = DBConnection;
//# sourceMappingURL=DBConnection.js.map