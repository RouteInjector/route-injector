///<reference path='../../../typings/index.d.ts'/>
import {IRouteInjector} from "../interfaces/IRouteInjector";
import Logger = require("./Logger");
import Configurations = require("./Configurations");
import ArgumentUtils = require("../../utils/ArgumentUtils");
class Bootstrapper {
    static logger = Logger.getLogger();

    private injector:IRouteInjector;
    private config:Configurations;

    constructor(injector:IRouteInjector) {
        Bootstrapper.logger.trace("Creating Bootstrapper instance");
        this.injector = injector;
        this.config = injector.config;
    }

    public static create(injector:IRouteInjector) {
        return new Bootstrapper(injector);
    }

    public bootstrap():void {
        if(ArgumentUtils.exists('bootstrap')){
            Bootstrapper.logger.info("Bootstrapping developer's data");
            this.injector.config.bootstrap(this.injector);
        }
        this.injector.config.bootstrap = null;
    }
}
export = Bootstrapper;