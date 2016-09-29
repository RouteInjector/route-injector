/**
 * Created by gerard on 1/19/16.
 */
///<reference path='../../typings/index.d.ts'/>
import {Schema} from "mongoose";
import Configurations = require("../internals/Configurations");
export interface IRouteInjector {
    start(cb:()=>void);
    log:any;
    loadPlugin(pluginName:string, config:Object);
    config:Configurations;
    mongoose:any;
}