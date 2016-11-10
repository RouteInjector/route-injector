/// <reference path='../../typings/index.d.ts'/>
import {Model} from "mongoose";
class ModelUtils {
    public static getBeforeDatabaseCallbacks(model:Model,requestType:RequestType){
        var modelConfig = model.injector();
        return modelConfig[requestType];
    }
}

export = ModelUtils;