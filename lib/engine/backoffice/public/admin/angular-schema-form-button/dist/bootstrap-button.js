angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/button/button.html","<div class=\"form-group\">\r\n    <button bk-button type=\"button\" ng-click=\"click()\" ng-show=\"showTitle()\" class=\"btn\">{{form.title}}</button>\r\n</div>");}]);
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

angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'button')) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'button';
                    f.action = schema.action;
                    if (f.action == 'api') {
                        f.method = schema.method;
                        f.url = schema.url;
                        f.params = schema.params;
                    } else if(f.action == 'function'){
                        f.func = schema.func;
                    }
                    f.function = schema.onClick;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'button',
                'directives/decorators/bootstrap/button/button.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'button',
                'directives/decorators/bootstrap/button/button.html'
            );
        }
    ]);
