/**
 * Created by gerard on 1/20/16.
 */
///<reference path='../../../typings/index.d.ts' />

import bunyan = require('bunyan');
import PrettyStream = require("bunyan-prettystream");
import FSUtils = require("../../utils/FSUtils");

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);
class Logger {

    /**
     * Get a logger to log your application
     * @param tag optional parameter. You can tag your logs with tag
     * @returns {Logger}
     */
    public static getLogger(tag?:string) {
        if (tag) {
            return Logger.logger.child({tag: tag})
        } else {
            return Logger.logger;
        }
    }

    /**
     * Create a custom logger. Only for internal use.
     * @param name
     * @param options
     * @returns {Logger}
     */
    private static createCustomLogger(name:string, options:{level:string}) {
        return bunyan.createLogger({
            name: name,
            streams: [{
                level: options.level || 'info',
                type: 'raw',
                stream: prettyStdOut
            }]
        });
    }

    private static DEFAULT_LOGGER_NAME = "RouteInjector";
    private static logger = Logger.createCustomLogger(Logger.DEFAULT_LOGGER_NAME, {
        level: "info"
    });

    /**
     * Set name
     * @param name
     */
    public static setName(name:string):void {
        Logger.createCustomLogger(name, {
            level: "info"
        });
    }

    public static setLevel(value:number | string):void {
        Logger.logger.level(value);
    }


}
export = Logger;
