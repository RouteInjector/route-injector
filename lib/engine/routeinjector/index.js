'use strict';

module.exports = RouteInjector;

var injector;
var core = {};
/**
 *
 * @param _injector
 * @constructor
 */
function RouteInjector(_injector) {
    if (!_injector) {
        throw new Error("Injector is not being supplied to RouteInjector");
    }
    injector = _injector;
    core.routes = require('./inject')(injector.app);
    core.typeBased = require('./typeBased')(injector.app);
}

/**
 * Start injecting with routeinjector
 */
RouteInjector.prototype.inject = function () {
    var models = injector.models;
    for (var m in models) {
        if (models.hasOwnProperty(m))
            generateModelRoutes(models[m]);
    }
    generateTypeBased();
};

/**
 * Inject the routes (Get/Post/Put/Delete/Search/Validate) for each model
 * @param Model
 */
function generateModelRoutes(Model) {
    core.routes(Model);
}

/**
 * Inject the typebased routes
 */
function generateTypeBased() {
    core.typeBased();
}