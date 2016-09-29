import Configurations = require("../app/internals/Configurations");
import FSUtils = require("./FSUtils");
/**
 * Created by gerard on 29/01/16.
 */
class ConfigUtils {
    private config:Configurations;

    constructor(config:Configurations){
        this.config = config;
    }

    public static create(config:Configurations){
        return new ConfigUtils(config);
    }

    public getApplicationStatics(callback:(url:string, path:string)=>void) {
        if (this.config.application.statics && this.config.application.statics instanceof Array) {
            var staticExports:string[] = Object.keys(this.config.application.statics);
            staticExports.forEach((staticExport)=> {
                var s = this.config.application.statics[staticExport];
                if (s.folder) {
                    var staticDirectory = FSUtils.join(this.config.appPath, s.folder);
                    callback(s.url, staticDirectory);
                }
            });
        }
    }

}
export = ConfigUtils;