var mongoose = require('mongoose');

require('./image/index')(mongoose);

var MongooseInjector;
module.exports = MongooseInjector = {};

MongooseInjector.RImage = {
    image: {type: String, format: "image"},
    fullPath: {type: String, class: "hidden", readonly: true},
    originalName: {type: String, class: "hidden", readonly: true}
};

MongooseInjector.RFile = {
    file: {type: String, format: "file"},
    fullPath: {type: String, class: "hidden", readonly: true},
    originalName: {type: String, class: "hidden", readonly: true}
};