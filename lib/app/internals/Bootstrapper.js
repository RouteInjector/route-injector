///<reference path='../../../typings/index.d.ts'/>
"use strict";
var Logger = require("./Logger");
var ArgumentUtils = require("../../utils/ArgumentUtils");
var Bootstrapper = (function () {
    function Bootstrapper(injector) {
        Bootstrapper.logger.trace("Creating Bootstrapper instance");
        this.injector = injector;
        this.config = injector.config;
    }
    Bootstrapper.create = function (injector) {
        return new Bootstrapper(injector);
    };
    Bootstrapper.prototype.bootstrap = function () {
        if (ArgumentUtils.exists('bootstrap')) {
            Bootstrapper.logger.info("Bootstrapping developer's data");
            this.injector.config.bootstrap(this.injector);
        }
        this.injector.config.bootstrap = null;
    };
    return Bootstrapper;
}());
Bootstrapper.logger = Logger.getLogger();
module.exports = Bootstrapper;
//# sourceMappingURL=Bootstrapper.js.map