angular.module('schemaForm').directive('bkSeconds', ['$http', '$routeParams', 'models', function ($http, $routeParams, models) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            ngModel.$render = function () {
                if (ngModel.$viewValue != undefined) {
                    scope.timeMinutes = Math.floor(ngModel.$viewValue / 60);
                    scope.timeSeconds = ngModel.$viewValue % 60;
                } else{
                    scope.timeMinutes = 0;
                    scope.timeSeconds = 0;
                }
            };

            scope.$watch("timeMinutes", function (newval) {
                if (newval != undefined)
                    ngModel.$setViewValue(newval * 60 + scope.timeSeconds);
            });

            scope.$watch("timeSeconds", function (newval) {
                if (newval != undefined)
                    ngModel.$setViewValue(scope.timeMinutes * 60 + newval);
            });
        }
    }
}]);
