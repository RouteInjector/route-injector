angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/datetimepicker/datetimepicker.html","<div class=\"form-group schema-form-{{form.type}} {{form.htmlClass}}\">\r\n    <!--<div ri-date date-picker=\"date\" view=\"minutes\" ng-model=\"$$value$$\"></div>-->\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n\r\n    <div ri-date ng-model=\"$$value$$\">\r\n        <!--<div class=\"col-md-6\">-->\r\n            <!--<div date-picker=\"modelDate\" view=\"date\" max-view=\"month\" min-view=\"date\"></div>-->\r\n        <!--</div>-->\r\n        <!--<div class=\"col-md-6\">-->\r\n            <!--<div date-picker=\"modelHours\" view=\"hours\" max-view=\"hours\"></div>-->\r\n        <!--</div>-->\r\n        <input date-time type=\"datetime\" ng-model=\"modelDate\" ng-change=\"{{updateDate(modelDate)}}\" view=\"date\" max-view=\"date\" class=\"form-control\" format=\"medium\">\r\n    </div>\r\n</div>");}]);
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

angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'datetimepicker' || schema.format === "date")) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'datetimepicker';
                    f.format = schema.dateFormat;

                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'datetimepicker',
                'directives/decorators/bootstrap/datetimepicker/datetimepicker.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'datetimepicker',
                'directives/decorators/bootstrap/datetimepicker/datetimepicker.html'
            );
        }
    ]);
