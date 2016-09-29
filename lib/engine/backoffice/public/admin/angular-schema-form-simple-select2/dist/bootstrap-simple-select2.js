angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/simpleselect2/simple-select2.html","<div class=\"form-group {{form.htmlClass}} schema-form-select\"\n     ng-class=\"{\'has-error\': form.disableErrorState !== true && hasError(), \'has-success\': form.disableSuccessState !== true && hasSuccess(), \'has-feedback\': form.feedback !== false}\">\n  <label class=\"control-label {{form.labelHtmlClass}}\" ng-show=\"showTitle()\">\n    {{form.title}}\n  </label>\n  <select simple-select\n	      ng-model=\"$$value$$\"\n          ng-model-options=\"form.ngModelOptions\"\n          ng-disabled=\"form.readonly\"\n          sf-changed=\"form\"\n          class=\"form-control {{form.fieldHtmlClass}}\"\n          schema-validate=\"form\"\n          map=\"form.map\"\n          dynmap=\"form.dynMap\"\n          dynenum=\"form.dynEnum\"\n          ng-options=\"item.value as item.name group by item.group for item in titleMap\"\n          name=\"{{form.key.slice(-1)[0]}}\">\n  </select>\n  <div class=\"help-block\" sf-message=\"form.description\"></div>\n</div>\n");}]);
angular.module('schemaForm').directive('simpleSelect', ['$http', '$routeParams', 'models', function ($http, $routeParams, models) {

    return {
        restrict: 'AE',
        require: ['ngModel'],
        link: function (scope, element, attrs, ngModel) {
            scope.titleMap = [];

            var map = scope.$eval(attrs.map);
            var dynMap = scope.$eval(attrs.dynmap);
            var dynEnum = scope.$eval(attrs.dynenum);

            if(dynEnum){
                $http.get(dynEnum).then(function(res){
                    var resultMap = {};
                    angular.forEach(res.data, function(elem){
                        resultMap[elem] = elem;
                    });
                    setMap(resultMap);
                });
            } else if(dynMap){
                $http.get(dynMap).then(function(res){
                   setMap(res.data);
                });
            } else if(map){
                setMap(map);
            }

            function setMap(map){
                angular.forEach(Object.keys(map), function(key) {
                    var value = map[key];
                    var o = {};
                    o.value = key;
                    if(typeof(value)=="string") {
                        o.name = value;
                    } else {
                        o.name = value.name;
                        o.group = value.group;
                    }
                    scope.titleMap.push(o);
                });
            }
        }
    }
}]);
angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var select2 = function (name, schema, options) {
                if (schema.map || schema.dynEnum || schema.dynMap) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'simpleselect2';
                    f.map = schema.map;
                    f.dynMap = schema.dynMap;
                    f.dynEnum = schema.dynEnum;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(select2);
            schemaFormProvider.defaults.number.unshift(select2);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'simpleselect2',
                'directives/decorators/bootstrap/simpleselect2/simple-select2.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'simpleselect2',
                'directives/decorators/bootstrap/simpleselect2/simple-select2.html'
            );
        }
    ]);
