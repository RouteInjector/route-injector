(function () {
    'use strict';

    angular.module('injectorApp').directive('injectorBargraph', ['$routeParams', 'models', function ($routeParams, models) {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'dist/js/directives/injector-bargraph/injector-bargraph.html',
            link: function (scope, element, attrs, ngModel) {

                var modelName = $routeParams.schema;
                models.getModelConfig(modelName, function (config) {
                    models.getGraph(modelName, attrs.graph, function (data) {

                        var graph = {};
                        for(var i in config.graphs){
                            var g = config.graphs[i];

                            if(g.title == attrs.graph){
                                graph = g;
                            }
                        }

                        scope.elements = Object.keys(data);
                        scope.selected = scope.elements[0];

                        if(graph.groupMode == "series"){
                            scope.selectEnabled = false;

                        } else if(graph.groupMode == "select"){
                            scope.selectEnabled = true;
                        } else{
                            console.error("Invalid configuration at bargraph group Mode:", graph.groupMode);
                        }

                        if (scope.selectEnabled === true) {
                            //GroupedBy with select2 !!
                            scope.barsData = [
                                {
                                    key: scope.selected,
                                    values: data[scope.selected]
                                }
                            ];

                            scope.$watch('selected', function (selected) {
                                if (scope.selectEnabled === true) {
                                    scope.barsData = [
                                        {
                                            key: selected,
                                            values: data[selected]
                                        }
                                    ];
                                }
                            });

                        } else {
                            //Grouped by in legend !
                            scope.barsData = [];
                            for (var key in data) {
                                scope.barsData.push(
                                    {
                                        key: key,
                                        values: data[key]
                                    });
                            }
                        }
                    });
                });
            }
        };
    }]);
}());
