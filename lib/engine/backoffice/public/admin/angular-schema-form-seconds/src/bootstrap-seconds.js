angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var seconds = function (name, schema, options) {
                if (schema.type === 'number' && schema.format === 'time-seconds') {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'seconds';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.number.unshift(seconds);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'seconds',
                'directives/decorators/bootstrap/seconds/seconds.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'seconds',
                'directives/decorators/bootstrap/seconds/seconds.html'
            );
        }
    ]);
