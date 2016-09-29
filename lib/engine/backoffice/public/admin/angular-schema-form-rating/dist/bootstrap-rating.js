angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/rating/rating.html","<div class=\"form-group\" ng-class=\"{\'has-error\': hasError()}\">\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\n    <rating bk-rating ng-model=\"$$value$$\" max=\"form.maxValue\" min=\"form.minValue\" state-on=\"form.iconOn\" state-off=\"form.iconOff\"></rating>\n</div>");}]);
angular.module('schemaForm').directive('bkRating', ['$http', '$routeParams', function ($http, $routeParams) {
    return {
        restrict: 'AE',
        link: function (scope, element, attrs, ngModel) {
        }
    }
}]);

angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'number' && (schema.format === 'rating')) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'rating';

                    if (schema.minValue)
                        f.minValue = schema.minValue;
                    if (schema.maxValue)
                        f.maxValue = schema.maxValue;
                    if (schema.iconOn)
                        f.iconOn = schema.iconOn;
                    if (schema.iconOff)
                        f.iconOff = schema.iconOff;

                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.number.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'rating',
                'directives/decorators/bootstrap/rating/rating.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'rating',
                'directives/decorators/bootstrap/rating/rating.html'
            );
        }
    ]);
