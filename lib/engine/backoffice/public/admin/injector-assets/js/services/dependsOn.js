(function () {
    'use strict';
    angular.module('injectorApp')
        .factory('dependsOn', function ($http, configs, common, models) {
        var factory = {};

        factory.find = function (obj) {
            var depArr = [];
            function innerDependsOn(obj, index) {
                if (typeof obj == "object") {
                    $.each(obj, function (k, v) {
                        // k is either an array index or object key
                        if (k == 'dependsOn') {
                            depArr.push({
                                path: index,
                                field: v.field,
                                params: v.params,
                                func: v.func
                            });
                        }
                        if (!index) {
                            index = k;
                        }
                        else {
                            index = index + '.' + k;
                        }
                        innerDependsOn(v, index);
                        var indexArray = index.split('.');
                        indexArray.pop();
                        index = indexArray.join('.');
                    });
                }
                else {
                    var indexArray = index.split('.');
                    indexArray.pop();
                    index = indexArray.join('.');
                }
            }

            innerDependsOn(obj);
            return depArr;
        };

        factory.apply = function (scope, modelName, doc) {
            function updateFunc(modelConfig, dependsValue, arrayIndex) {
                return function(newVal, oldVal) {
                    if (newVal) {
                        //configs.getRoutesConfig(function (c) {
                            var url = configs.app.prefix + '/_' + modelConfig.path + '/' + dependsValue.func ;
                            var body = {};
                            angular.forEach(dependsValue.params, function (param) {
                                body[param]= safeAccess(doc, param);
                            });

                            /*if(arrayIndex !== undefined){ //TODO: I'm not sure...
                                url += '/' + arrayIndex;
                            }*/

                            $http.post(url, body).success(function (data) {
                                var replaced = dependsValue.path.replace(/properties\./g, '');

                                if(arrayIndex !== undefined){
                                    replaced = replaced.replace(/\.items/g, '[' + arrayIndex + ']');
                                }

                                common.setField(replaced, doc, data);
                            });
                        //});
                    }
                };
            }


            models.getModel(modelName, function (m) {
                var depArr = factory.find(m.schema);
                $.each(depArr, function (k, v) {
                    if ((/(this\.)/).test(v.field)) {
                        var path = v.path.replace(/properties\./g, '');
                        var root = path.split('.')[0];
                        var targetField = v.field.replace(/(this\.)/, "");

                        if ((/(items)/).test(path)) { //Is an array
                            scope.$watchCollection("model." + root, function (nV, oV) {
                                if (nV && nV instanceof Array) {
                                    for (var i in nV) {
                                        var normPath = root + "[" + i + "]." + targetField;
                                        for (var p in v.params) {
                                            v.params[p] = normPath;
                                        }
                                        scope.$watch("model." + normPath, updateFunc(m.config, angular.copy(v), angular.copy(i)));
                                    }
                                }
                            });
                        } else{ // Is an object
                            var normPath = root + "." + targetField;
                            scope.$watch('model' + '.' + normPath, updateFunc(m.config, angular.copy(v)));
                        }
                    } else {
                        scope.$watch('model' + '.' + v.field, updateFunc(m.config, v));
                    }
                });
            });
        };

        return factory;
    });
}());