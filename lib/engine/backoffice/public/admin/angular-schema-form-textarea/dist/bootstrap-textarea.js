angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/textarea/textarea.html","<div class=\"form-group has-feedback\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess()}\">\n    <label ng-show=\"showTitle()\">{{form.title}}</label>\n    <textarea class=\"form-control\"\n              sf-changed=\"form\"\n              placeholder=\"{{form.placeholder}}\"\n              ng-disabled=\"form.readonly\"\n              ng-model=\"$$value$$\"\n              ng-model-options=\"form.ngModelOptions\"\n              schema-validate=\"form\"\n              rows=\"{{form.rows}}\"></textarea>\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\n</div>");}]);
angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'textarea')) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'textarea';
                    f.rows = schema.rows;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'textarea',
                'directives/decorators/bootstrap/textarea/textarea.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'textarea',
                'directives/decorators/bootstrap/textarea/textarea.html'
            );
        }
    ]);
