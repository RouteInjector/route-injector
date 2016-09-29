"use strict";
/**
 * Created by gerard on 27/01/16.
 */
var RiResponse = (function () {
    function RiResponse(title, msg) {
        this.error = title;
        this.message = msg;
    }
    RiResponse.prototype.toJson = function () {
        return {
            error: this.error,
            message: this.message
        };
    };
    return RiResponse;
}());
module.exports = RiResponse;
//# sourceMappingURL=Response.js.map