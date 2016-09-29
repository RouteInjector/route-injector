angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
            var mixed = function (name, schema, options) {
                if (schema.type == 'object' && !schema.ref && !schema.format && schema.mixed) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'mixed';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.object.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'mixed',
                'directives/decorators/bootstrap/mixed/mixed.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'mixed',
                'directives/decorators/bootstrap/mixed/mixed.html'
            );
        }
    ]);
