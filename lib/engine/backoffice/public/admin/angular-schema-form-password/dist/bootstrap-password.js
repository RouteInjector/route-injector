angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/password/password.html","<div class=\"form-group has-feedback {{form.divStyle}}\" ng-class=\"{\'has-error\': hasError(), \'has-success\': hasSuccess()}\">\r\n    <label ng-show=\"showTitle()\">{{form.title}}</label>\r\n    <input type=\"password\" class=\"form-control {{form.style}}\"\r\n              sf-changed=\"form\"\r\n              placeholder=\"{{form.placeholder}}\"\r\n              ng-disabled=\"form.readonly\"\r\n              ng-model=\"$$value$$\"\r\n              ng-model-options=\"form.ngModelOptions\"\r\n              schema-validate=\"form\">\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>");}]);
angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'password')) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'password';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'password',
                'directives/decorators/bootstrap/password/password.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'password',
                'directives/decorators/bootstrap/password/password.html'
            );
        }
    ]);
