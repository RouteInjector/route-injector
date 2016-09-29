(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('GraphsController', function ($scope, $routeParams, $sce, $compile, models) {
        $scope.schema = $routeParams.schema;

        models.getModelConfig($scope.schema, function (config) {
            $scope.config = config;
            $scope.graphs = config.graphs;
        });

        $scope.getTag = function (graph) {
            var tag = graph.type;
            return '<injector-'+ tag +' graph="' + graph.title + '"></injector-'+ tag +'>';
        };
    });
}());