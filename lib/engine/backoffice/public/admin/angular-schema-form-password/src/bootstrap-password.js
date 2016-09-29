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
