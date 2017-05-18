"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/**
 * Created by gerard on 27/01/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var RiResponse = require("./Response");
var InternalServerError = (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(msg) {
        var _this = this;
        var m = "";
        if (msg) {
            m = msg;
        }
        _this = _super.call(this, "Internal Server Error", msg) || this;
        return _this;
    }
    InternalServerError.prototype.getStatusCode = function () {
        return 500;
    };
    return InternalServerError;
}(RiResponse));
module.exports = InternalServerError;
//# sourceMappingURL=InternalServerError.js.map