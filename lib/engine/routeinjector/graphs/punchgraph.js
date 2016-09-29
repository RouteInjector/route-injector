var injector = require('../../../');
var log = injector.log;
var statusCode = require('statusCode');
var _ = require('lodash');

module.exports.punchgraph = function (Model, punchcard) {

    var dateField = punchcard.dateField;
    var groupBy = punchcard.groupBy || "";
    var defaultQuery = punchcard.query || {};
    return function (req, res) {
        var query = req.body || {};

        var projection = {};
        projection[dateField] = 1;

        if (groupBy != "")
            projection[groupBy] = 1;

        var mapReducer = {};
        var scope = {};

        scope.dateField = dateField;
        scope.groupBy = groupBy;
        scope.cache = {};

        mapReducer.query = defaultQuery;
        _.extend(mapReducer.query, query);

        mapReducer.map = function () {
            if(this[dateField] && this[dateField].getDay && this[dateField].getHours) {
                var dayOfWeek = this[dateField].getDay();
                var hourOfDay = this[dateField].getHours();

                var group = this[groupBy] || "-";

                //printjson('emitted: ' + group + "-" + dayOfWeek + "-" + hourOfDay);

                emit(group, {day: dayOfWeek, hour: hourOfDay});
            }
        };

        mapReducer.scope = scope;


        mapReducer.reduce = function (key, values) {
            if(!cache[key]){
                cache[key] = {group: key};
            }
            var reducedVal = cache[key];

            for (var v = 0; v < values.length; v++) {
                var t = values[v].hour;
                var day = values[v].day;
                if (day != undefined) {
                    if(!reducedVal.data){
                        reducedVal.data = {};
                    }
                    if (!reducedVal.data[day]) {
                        reducedVal.data[day] = { hours: {}};
                    }

                    if (reducedVal.data[day].hours[t] || reducedVal.data[day].hours[t] >= 0) {
                        reducedVal.data[day].hours[t]++;
                    } else {
                        reducedVal.data[day].hours[t] = 1;
                    }
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

            var retJson = {};
            for (var g in data) {
                var groupedData = data[g].value;

                //Initialize days
                var groupJson = [];
                for (var day = 0; day < 7; day++) {

                    //Set hours array
                    var hours = [];
                    for (var hi = 0; hi < 24; hi++) {
                        hours.push(0);
                    }
                    groupJson.push(hours);
                }

                for (var i in groupedData.data) {
                    var elem = groupedData.data[i];

                    var hours = groupJson[i];

                    //Move hours from object to ordered array !
                    for (var k in elem.hours) {
                        hours[k] = elem.hours[k];
                    }

                    groupJson[i] = hours;
                }
                retJson[groupedData.group] = groupJson;
            }
            res.json(retJson);
            res.end();
        });
    }
};
