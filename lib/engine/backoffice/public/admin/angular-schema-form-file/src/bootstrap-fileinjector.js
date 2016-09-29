angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var fileinjector = function (name, schema, options) {
                if (schema.type === 'string' && schema.format === 'file') {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'fileinjector';
                    f.index = 'arrayIndex';
                    f.path = schema.path;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(fileinjector);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'fileinjector',
                'directives/decorators/bootstrap/fileinjector/fileinjector.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'fileinjector',
                'directives/decorators/bootstrap/fileinjector/fileinjector.html'
            );
        }
    ]);
