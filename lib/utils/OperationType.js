"use strict";
/**
 * Created by gerard on 13/04/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var OperationType;
(function (OperationType) {
    OperationType[OperationType["GET"] = "get"] = "GET";
    OperationType[OperationType["POST"] = "post"] = "POST";
    OperationType[OperationType["PUT"] = "put"] = "PUT";
    OperationType[OperationType["DELETE"] = "delete"] = "DELETE";
    OperationType[OperationType["SEARCH"] = "search"] = "SEARCH";
    OperationType[OperationType["VALIDATE"] = "validate"] = "VALIDATE";
})(OperationType || (OperationType = {}));
module.exports = OperationType;
//# sourceMappingURL=OperationType.js.map