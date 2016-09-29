module.exports = exports = function injector(schema, options) {
    schema.statics.injector = function () {
        return options || require('./default');
    }

    schema.methods.addRequest = function (req) {
        this.__req = req;
    }
};

module.exports.types = require('./types');