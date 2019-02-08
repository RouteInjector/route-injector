"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
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
var NotFound = /** @class */ (function (_super) {
    __extends(NotFound, _super);
    function NotFound(msg) {
        return _super.call(this, "Not Found", msg) || this;
    }
    NotFound.prototype.getStatusCode = function () {
        return 404;
    };
    return NotFound;
}(RiResponse));
module.exports = NotFound;
//# sourceMappingURL=NotFound.js.map