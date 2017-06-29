"use strict";
/**
 * Created by gerard on 08/02/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var ArgumentUtils = (function () {
    function ArgumentUtils() {
    }
    ArgumentUtils.getArguments = function () {
        return Object.keys(ArgumentUtils.args);
    };
    ArgumentUtils.exists = function (string) {
        return ArgumentUtils.args[string] ? true : false;
    };
    ArgumentUtils.getValue = function (argumentName) {
        return ArgumentUtils.args[argumentName];
    };
    ArgumentUtils.args = require("minimist")(process.argv.slice(2));
    return ArgumentUtils;
}());
module.exports = ArgumentUtils;
//# sourceMappingURL=ArgumentUtils.js.map