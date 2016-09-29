angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'button')) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'button';
                    f.action = schema.action;
                    if (f.action == 'api') {
                        f.method = schema.method;
                        f.url = schema.url;
                        f.params = schema.params;
                    } else if(f.action == 'function'){
                        f.func = schema.func;
                    }
                    f.function = schema.onClick;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'button',
                'directives/decorators/bootstrap/button/button.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'button',
                'directives/decorators/bootstrap/button/button.html'
            );
        }
    ]);
