var statusCode = require('http-status-codes');
var injector = require('../../../');
//var mongoose = injector.mongoose;
//var _ = require('lodash');

//function filterConfig(type) {
//    var config = injector.config[type];
//    var c = {};
//    _.assign(c, config);
//
//    if (config) {
//        if (type == "env") {
//            c.database = undefined;
//            c.bind = undefined;
//            c.images = undefined;
//            return c;
//        } else if (type == "auth") {
//            return {};
//        } else if (type == "session") {
//            c.secret = undefined;
//            return c;
//        }
//        else {
//            return config;
//        }
//    } else {
//        return {};
//    }
//
//}
//module.exports.getConfig = function (req, res) {
//    res.statusCode = statusCode.OK;
//    var c = filterConfig(req.params.config);
//    res.json(c);
//    res.end();
//};

module.exports.getConfigs = function (req, res) {
    res.statusCode = statusCode.OK;
    var json = {};
    json['backoffice'] = injector.config['backoffice'];
    json['backoffice']['version'] = require('../../../../package.json').version;
    json['auth'] = injector.config['env']['auth'];
    json['app'] = {
        name: injector.config['application']['name'],
        logo: injector.config['application']['logo'],
        favicon: injector.config['application']['favicon'],
        prefix: injector.config['routes']['prefix']
    };
    if (injector.config.env.images) {
        json['images'] = {}
        if (injector.config.env.images.gallery) {
            json['images']['gallery'] = {
                "endpoint": injector.config.env.images.gallery.endpoint,
                "listDirectory": injector.config.env.images.gallery.listDirectory,
                "postImage": injector.config.env.images.gallery.postImage,
                "deleteImage": injector.config.env.images.gallery.deleteImage,
                "menu": injector.config.env.images.gallery.menu
            }

        }
    }
    res.json(json);
    return res.end();
};