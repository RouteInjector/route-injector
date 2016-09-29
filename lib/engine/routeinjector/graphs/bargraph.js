var injector = require('../../../');
var log = injector.log;
var statusCode = require('statusCode');
var _ = require('lodash');

module.exports.bargraph = function (Model, bargraph) {

    var groupBy = bargraph.groupBy || "";
    var axis = bargraph.xAxisField;
    var defaultQuery = bargraph.query || {};
    return function (req, res) {
        var query = req.body;

        var mapReducer = {};
        var scope = {};

        scope.groupBy = groupBy;
        scope.axis = axis;
        scope.cache = {};

        mapReducer.query = defaultQuery;
        _.extend(mapReducer.query, query);

        mapReducer.map = function () {
            var group = this[groupBy] || "-";
            var axiselem = this[axis];
            if(axiselem)
                emit(group, axiselem);
        };

        mapReducer.scope = scope;

        mapReducer.reduce = function (key, values) {
            if (!cache[key]) {
                cache[key] = {};
            }
            var reducedVal = cache[key];

            for (var i = 0; i < values.length; i++) {
                var value = values[i];
                if (reducedVal[value]) {
                    reducedVal[value]++;
                } else {
                    reducedVal[value] = 1;
                }
            }
            return reducedVal;
        };

        Model.mapReduce(mapReducer, function (err, data, stats) {
            if (err) {
                log.error(err);
                res.statusCode = statusCode.InternalServerError();
                res.json(err);
                return res.end();
            }
            var returnJson = {};

            for(var key in data){
                var keyID = data[key]._id;
                returnJson[keyID] = [];

                for(var element in data[key].value){
                    var tmpArray = [];
                    tmpArray.push(element);
                    tmpArray.push(data[key].value[element]);
                    returnJson[keyID].push(tmpArray);
                }
            }
            res.json(returnJson);
            res.end();
        });
    }
};
