/**
 * Created by gerard on 1/19/16.
 */
///<reference path='../../../typings/index.d.ts'/>
import {Schema} from "mongoose";
import {IRouteInjector} from "./IRouteInjector";
export interface IPlugin {
    /**
     * This function gets called once the plugin is loaded in route injector
     * @param injector
     * @param pluginUserConf
     */
    init(pluginUserConf:any):void;

    /**
     * This function gets called on the modify schema stage of route injector. Plugins can modify schemas before this ones are compiled to mongoose models
     * @param modelName
     * @param schema
     */
    modifySchemaFromModel(modelName:string, schema:Schema):void;

    /**
     * This function is called ones the auth system is loaded. If plugin requires to modify the auth system it should use this function onces is invoked.
     */
    onAuthLoaded():void;

    /**
     * This function will be called before the framework starts to inject model routes
     * @param app
     */
    preInject(app:any):void;

    /**
     * This function will be called after the framework ends the model route injection
     * @param app
     */
    postInject(app:any):void;

    /**
     *  This property gives the name of the plugin
     */
    name:string;

    /**
     * This property gives an array of strings that represent the directories inside a plugin that contains routes
     */
    routes:string[];
    /**
     * This property gives an array of objects that represent statics. They must contain url and
     */
    statics:any[];
}

export interface IMetaPlugin {
    plugin: IPlugin;
    path: string;
}