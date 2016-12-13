"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/**
 * Created by gerard on 27/01/16.
 */
/// <reference path='../../typings/index.d.ts'/>
var RiResponse = require("./Response");
var Unauthorized = (function (_super) {
    __extends(Unauthorized, _super);
    function Unauthorized(msg) {
        return _super.call(this, "Unauthorized", msg) || this;
    }
    Unauthorized.prototype.getStatusCode = function () {
        return 401;
    };
    return Unauthorized;
}(RiResponse));
module.exports = Unauthorized;
//# sourceMappingURL=Unauthorized.js.map