angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var mixed = function (name, schema, options) {
                if (schema.type === 'string' && (schema.format === 'datetimepicker' || schema.format === "date")) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'datetimepicker';
                    f.format = schema.dateFormat;

                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'datetimepicker',
                'directives/decorators/bootstrap/datetimepicker/datetimepicker.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'datetimepicker',
                'directives/decorators/bootstrap/datetimepicker/datetimepicker.html'
            );
        }
    ]);
