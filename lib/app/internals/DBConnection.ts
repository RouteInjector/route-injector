/**
 * Created by gerard on 1/15/16.
 */
/// <reference path='../../../typings/index.d.ts'/>

import Logger = require("./Logger");
import Configurations = require("./Configurations");
import mongoose = require("mongoose");

class DBConnection {
    private static logger = Logger.getLogger();
    private config:Configurations;

    constructor(config:Configurations) {
        DBConnection.logger.trace("Creating DBConnection instance");
        this.config = config;
        this.debug(this.config.env.database.debug || false);
    }

    public static create(config:Configurations) {
        return new DBConnection(config);
    }

    public debug(bool:boolean):void {
        mongoose.set('debug', bool);
    }

    public connect(cb:()=>void) {
        var db = mongoose.connection;
        db.on('error', (err)=> {
            DBConnection.logger.error("Mongo Error (" + this.config.env.database.endpoint + '/' + this.config.env.database.name + ")", err);
        });
        db.once('open', ()=> {
            DBConnection.logger.info('');
            DBConnection.logger.info('Mongo is UP (' + this.config.env.database.endpoint + '/' + this.config.env.database.name + ')');
            DBConnection.logger.info('');
            cb();
        });
        mongoose.connect('mongodb://' + this.config.env.database.endpoint + '/' + this.config.env.database.name);
    }

    get mongoose():any {
        return mongoose;
    }

}
export = DBConnection;