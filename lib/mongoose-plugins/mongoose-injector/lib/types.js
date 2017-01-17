var mongoose = require('mongoose');

require('./image')(mongoose);
require('./gallery')(mongoose);

var MongooseInjector;
module.exports = MongooseInjector = {};

MongooseInjector.RImage = {
    type: mongoose.Schema.Types.Gallery,
    format: 'image'
};

MongooseInjector.RFile = {
    type: mongoose.Schema.Types.Gallery,
    format: 'file'
};