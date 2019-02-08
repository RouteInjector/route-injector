"use strict";
var ModelUtils = /** @class */ (function () {
    function ModelUtils() {
    }
    ModelUtils.getBeforeDatabaseCallbacks = function (model, requestType) {
        var modelConfig = model.injector();
        return modelConfig[requestType];
    };
    return ModelUtils;
}());
module.exports = ModelUtils;
//# sourceMappingURL=ModelUtils.js.map