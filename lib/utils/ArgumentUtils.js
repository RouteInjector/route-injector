/**
 * Created by gerard on 08/02/16.
 */
"use strict";
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
    return ArgumentUtils;
}());
ArgumentUtils.args = require('minimist')(process.argv.slice(2));
module.exports = ArgumentUtils;
//# sourceMappingURL=ArgumentUtils.js.map