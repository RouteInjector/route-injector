angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
            var select2 = function (name, schema, options) {
                if (schema.ref) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'select2';
                    f.query = schema.query;
                    f.ref = schema.ref;
                    f.shard = schema.shard;
                    f.dependsOn = schema.dependsOn;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(select2);
            schemaFormProvider.defaults.object.unshift(select2);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'select2',
                'directives/decorators/bootstrap/select2/select2.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'select2',
                'directives/decorators/bootstrap/select2/select2.html'
            );
        }
    ]);
