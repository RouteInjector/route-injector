angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var multiselect = function (name, schema, options) {
                if (schema.type === 'array' && schema.items.type === 'string' && (schema.items.enum || schema.items.enumUrl || schema.items.map)) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'multiselect';
                    f.map = schema.items.map;
                    f.enum = schema.items.enum;
                    f.path = schema.path;
                    f.separator = schema.items.separator;
                    f.locked = schema.items.limitToOptions || false;
                    f.url = schema.items.enumUrl;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;

                    return f;
                }
            };

            schemaFormProvider.defaults.array.unshift(multiselect);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'multiselect',
                'directives/decorators/bootstrap/multiselect/multiselect.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'multiselect',
                'directives/decorators/bootstrap/multiselect/multiselect.html'
            );
        }
    ]);
