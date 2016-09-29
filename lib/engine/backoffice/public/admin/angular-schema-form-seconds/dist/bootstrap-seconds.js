angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/seconds/seconds.html","<fieldset ng-disabled=\"form.readonly\" class=\"schema-form-fieldset {{form.htmlClass}}\">\n    <legend ng-show=\"form.title\">{{ form.title }}</legend>\n\n    <!--<sf-decorator>-->\n    <div class=\"form-group schema-form-number col-xs-3 has-success has-feedback\">\n        <label>Minutes</label>\n        <input type=\"number\" min=\"0\" class=\"form-control\" ng-model=\"timeMinutes\"/>\n            <span ng-if=\"form.feedback !== false\" class=\"form-control-feedback ng-scope glyphicon glyphicon-ok\"\n                  ng-class=\"evalInScope(form.feedback) || {\'glyphicon\': true, \'glyphicon-ok\': hasSuccess(), \'glyphicon-remove\': hasError() }\"\n                  aria-hidden=\"true\"></span>\n    </div>\n    <!--</sf-decorator>-->\n\n    <!--<sf-decorator class=\"ng-scope\">-->\n    <div class=\"form-group schema-form-number col-xs-3 has-success has-feedback\">\n        <label>Seconds</label>\n        <input type=\"number\" min=\"0\" max=\"59\" class=\"form-control\" ng-model=\"timeSeconds\"/>\n            <span ng-if=\"form.feedback !== false\" class=\"form-control-feedback ng-scope glyphicon glyphicon-ok\"\n                  ng-class=\"evalInScope(form.feedback) || {\'glyphicon\': true, \'glyphicon-ok\': hasSuccess(), \'glyphicon-remove\': hasError() }\"\n                  aria-hidden=\"true\"></span>\n    </div>\n    <!--</sf-decorator>-->\n    <div class=\"help-block\"\n         ng-show=\"(hasError() && errorMessage(schemaError())) || form.description\"\n         ng-bind-html=\"(hasError() && errorMessage(schemaError())) || form.description\"></div>\n</fieldset>\n\n<input bk-seconds ng-model=\"$$value$$\" type=\"hidden\"/>");}]);
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

angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var seconds = function (name, schema, options) {
                if (schema.type === 'number' && schema.format === 'time-seconds') {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'seconds';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.number.unshift(seconds);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'seconds',
                'directives/decorators/bootstrap/seconds/seconds.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'seconds',
                'directives/decorators/bootstrap/seconds/seconds.html'
            );
        }
    ]);
