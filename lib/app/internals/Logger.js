/**
 * Created by gerard on 1/20/16.
 */
///<reference path='../../../typings/index.d.ts' />
"use strict";
var bunyan = require('bunyan');
var PrettyStream = require("bunyan-prettystream");
var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);
var Logger = (function () {
    function Logger() {
    }
    /**
     * Get a logger to log your application
     * @param tag optional parameter. You can tag your logs with tag
     * @returns {Logger}
     */
    Logger.getLogger = function (tag) {
        if (tag) {
            return Logger.logger.child({ tag: tag });
        }
        else {
            return Logger.logger;
        }
    };
    /**
     * Create a custom logger. Only for internal use.
     * @param name
     * @param options
     * @returns {Logger}
     */
    Logger.createCustomLogger = function (name, options) {
        return bunyan.createLogger({
            name: name,
            streams: [{
                    level: options.level || 'info',
                    type: 'raw',
                    stream: prettyStdOut
                }]
        });
    };
    /**
     * Set name
     * @param name
     */
    Logger.setName = function (name) {
        Logger.createCustomLogger(name, {
            level: "info"
        });
    };
    Logger.setLevel = function (value) {
        Logger.logger.level(value);
    };
    Logger.DEFAULT_LOGGER_NAME = "RouteInjector";
    Logger.logger = Logger.createCustomLogger(Logger.DEFAULT_LOGGER_NAME, {
        level: "info"
    });
    return Logger;
}());
module.exports = Logger;
//# sourceMappingURL=Logger.js.map