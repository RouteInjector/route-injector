(function () {
    'use strict';

    angular.module('injectorApp').directive('injectorPunchcard', ['$routeParams', 'models', function ($routeParams, models) {
        return {
            restrict: 'AE',
            scope: true,
            templateUrl: 'dist/js/directives/injector-punchcard/injector-punchcard.html',
            link: function (scope, element, attrs, ngModel) {
                var modelName = $routeParams.schema;
                models.getGraph(modelName, attrs.graph, function(data){
                    scope.elements = Object.keys(data);
                    scope.selected = scope.elements[0];
                    scope.punchCardData = data[scope.selected];
                    scope.$watch('selected', function(selected){
                       scope.punchCardData = data[selected];
                    });
                });
            }
        };
    }]);
}());
