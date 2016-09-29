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
