angular.module('schemaForm').directive('riDate', ['$http', '$routeParams', 'models', function ($http, models) {

    return {
        restrict: 'A',
        require: 'ngModel',
        scope:false,
        link: function (scope, element, attrs, ngModel) {
            scope.modelDate = null;
            ngModel.$render = function(){
                if(ngModel.$viewValue){
                    if(!scope.modelDate || (scope.modelDate && scope.modelDate.toString() != ngModel.$viewValue)) {
                        scope.modelDate = new Date(ngModel.$viewValue);
                    }
                    //scope.modelHours = new Date(ngModel.$viewValue);
                }
            };

            scope.updateDate = function(m){
                ngModel.$setViewValue(m);

                if(m == "" || !m){
                    ngModel.$setViewValue(null);
                }
            };
        }
    }
}]);
