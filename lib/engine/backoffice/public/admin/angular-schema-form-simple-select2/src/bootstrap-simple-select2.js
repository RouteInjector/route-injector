angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var select2 = function (name, schema, options) {
                if (schema.map || schema.dynEnum || schema.dynMap) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'simpleselect2';
                    f.map = schema.map;
                    f.dynMap = schema.dynMap;
                    f.dynEnum = schema.dynEnum;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.string.unshift(select2);
            schemaFormProvider.defaults.number.unshift(select2);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'simpleselect2',
                'directives/decorators/bootstrap/simpleselect2/simple-select2.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'simpleselect2',
                'directives/decorators/bootstrap/simpleselect2/simple-select2.html'
            );
        }
    ]);
