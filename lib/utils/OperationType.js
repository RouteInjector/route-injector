"use strict";
/**
 * Created by gerard on 13/04/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var OperationType = (function () {
    function OperationType() {
    }
    return OperationType;
}());
OperationType.GET = "get";
OperationType.POST = "post";
OperationType.PUT = "put";
OperationType.DELETE = "delete";
OperationType.SEARCH = "search";
OperationType.VALIDATE = "validate";
module.exports = OperationType;
//# sourceMappingURL=OperationType.js.map