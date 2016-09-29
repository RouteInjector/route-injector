angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {

            var newImageInjector = function (name, schema, options) {
                if (schema.type === 'image') {
                    var pathArray = options.path.filter(function(e){return e});
                    //pathArray = pathArray.map(function (e) {
                    //    if (e != "") {
                    //        return e;
                    //    }
                    //});
                    var path = pathArray.join('.');

                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'image';
                    f.index = 'arrayIndex';
                    f.path = path;
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            if (!schemaFormProvider.defaults.image)
                schemaFormProvider.defaults.image = [];
            schemaFormProvider.defaults.image.unshift(newImageInjector);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'image',
                'directives/decorators/bootstrap/new-imageinjector/new-imageinjector.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'image',
                'directives/decorators/bootstrap/new-imageinjector/new-imageinjector.html'
            );
        }
    ]);
