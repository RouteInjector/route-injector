/// <reference path='../../typings/index.d.ts'/>
"use strict";
var FSUtils = require("./FSUtils");
/**
 * Created by gerard on 29/01/16.
 */
var ConfigUtils = (function () {
    function ConfigUtils(config) {
        this.config = config;
    }
    ConfigUtils.create = function (config) {
        return new ConfigUtils(config);
    };
    ConfigUtils.prototype.getApplicationStatics = function (callback) {
        var _this = this;
        if (this.config.application.statics && this.config.application.statics instanceof Array) {
            var staticExports = Object.keys(this.config.application.statics);
            staticExports.forEach(function (staticExport) {
                var s = _this.config.application.statics[staticExport];
                if (s.folder) {
                    var staticDirectory = FSUtils.join(_this.config.appPath, s.folder);
                    callback(s.url, staticDirectory);
                }
            });
        }
    };
    return ConfigUtils;
}());
module.exports = ConfigUtils;
//# sourceMappingURL=ConfigUtils.js.map