var injector = require('../../../');
var log = injector.log;
var statusCode = require('http-status-codes');
var _ = require('lodash');

module.exports.geograph = function (Model, geograph) {

    var geoField = geograph.geoField;
    var groupBy = geograph.groupBy || "";
    var defaultQuery = geograph.query || {};
    return function (req, res) {
        var query = req.body;

        var projection = {};
        projection[geoField] = 1;

        if (groupBy != "")
            projection[groupBy] = 1;

        var mapReducer = {};
        var scope = {};

        scope.geoField = geoField;
        scope.groupBy = groupBy;
        scope.cache = {};

        mapReducer.query = defaultQuery;
        _.extend(mapReducer.query, query);

        mapReducer.map = function () {
            var group = this[groupBy] || "-";
            var geo = this[geoField];
            emit(group, {elem: this, geo: geo});
        };

        mapReducer.scope = scope;

        mapReducer.reduce = function (key, values) {
            if(!cache[key]){
                cache[key] = {};
            }
            var reducedVal = cache[key];

            for(var i = 0; i < values.length; i++){
                
            }

            return reducedVal;
        };

        Model.mapReduce(mapReducer, function (err, data, stats) {
            if (err) {
                log.error(err);
                res.statusCode = statusCode.INTERNAL_SERVER_ERROR;
                res.json(err);
                return res.end();
            }
            res.json(data);
            res.end();
        });
    }
};
