angular.module('schemaForm').directive('bkButton', ['$http', '$routeParams', 'models', function ($http, models) {

    return {
        restrict: 'A',
        link: function (scope, element, attrs, ngModel) {
            var form = scope.form;
            scope.click = function () {
                scope.$emit('bkButton', form);
                //if (form.action == 'api') {
                //    if (form.method == 'GET') {
                //        $http.get(form.url + 'dfdfdf').success(function (res) {
                //            console.log(res);
                //        }).error(function (err) {
                //            console.error(err);
                //        });
                //    }
                //} else if (form.action == 'function') {
                //    console.log(scope.form);
                //    window[form.func]();
                //}
            };
        }
    }
}]);
