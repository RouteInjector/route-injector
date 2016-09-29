angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var imageinjector = function (name, schema, options) {
                if (schema.type === 'string' && schema.format === 'image') {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'imageinjector';
                    f.index = 'arrayIndex';
                    f.path = schema.path;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(imageinjector);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'imageinjector',
                'directives/decorators/bootstrap/imageinjector/imageinjector.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'imageinjector',
                'directives/decorators/bootstrap/imageinjector/imageinjector.html'
            );
        }
    ]);
