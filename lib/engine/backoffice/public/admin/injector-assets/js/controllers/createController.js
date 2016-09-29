(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('CreateController', function ($scope, $http, $location, $routeParams, models, $controller) {
            var modelName = $routeParams.schema;
            $scope.action = "create";
            models.getModel(modelName, function (m) {
                if (!m.config.post) {
                    $location.path('/model/' + modelName);
                } else {
                    $scope.model = {};
                    $scope.m = m;
                    $scope.action = "create";
                    $controller('FormController', {$scope: $scope}); //This works
                }
            });
        });
}());