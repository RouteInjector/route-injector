(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('UpdateController', function ($scope, $http, $routeParams, $location, models, $controller) {
            var modelName = $routeParams.schema;
            var id = $routeParams.id;
            var shard = $routeParams.shard;

            models.getModel(modelName, function (m) {
                models.getDocument(modelName, id, shard, function (document) {
                    $scope.prune(document);
                    $scope.action = "update";
                    $scope.model = document || {};
                    $scope.m = m;
                    $controller('FormController', {$scope: $scope}); //This works
                });
            });

            //We made this in client because is an specefic management of angular-schema-form
            $scope.prune = function (document) {
                for (var key in document) {
                    var elem = document[key];
                    if (elem && (typeof elem === 'object' || elem instanceof Array)) {
                        $scope.prune(elem);
                    }
                    if (elem == null) {//Angular schema form does not allow null elements. Undefined is better
                        document[key] = undefined;
                    }
                }
            };
        });
}());