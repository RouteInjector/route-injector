angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/mixed/mixed.html","<link rel=\"stylesheet\" href=\"dist/css/codemirror/theme/monokai.css\"/>\r\n<div class=\"form-group\" ng-class=\"{\'has-error\': hasError()}\">\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n    <ui-codemirror ui-codemirror-opts=\"editorOptions\" ng-model=\"$$value$$\" ui-codemirror=\"{ onLoad : codemirrorLoaded }\"></ui-codemirror>\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>\r\n<script src=\"dist/extra/codemirror/javascript.js\"></script>");}]);
angular.module('schemaForm').directive('uiCodemirror', ['$http', '$routeParams', 'models', function ($http, $routeParams, models) {
    return {
        restrict: 'AE',
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            scope.editorOptions = {
                lineNumbers: true,
                //theme: 'monokai',
                mode: 'application/json',
                foldGutter: {
                    rangeFinder: new CodeMirror.fold.combine(CodeMirror.fold.brace)
                },
                matchBrackets: true,
                gutters: ["CodeMirror-foldgutter"]
            };
        }
    }
}]);

angular.module('ui.codemirror', []).constant('uiCodemirrorConfig', {}).directive('uiCodemirror', [
    'uiCodemirrorConfig',
    function (uiCodemirrorConfig) {
        return {
            restrict: 'EA',
            require: '?ngModel',
            priority: 1,
            compile: function compile() {
                // Require CodeMirror
                if (angular.isUndefined(window.CodeMirror)) {
                    throw new Error('ui-codemirror need CodeMirror to work... (o rly?)');
                }
                return function postLink(scope, iElement, iAttrs, ngModel) {
                    var options, opts, codeMirror, initialTextValue;
                    initialTextValue = iElement.text();
                    options = uiCodemirrorConfig.codemirror || {};
                    opts = angular.extend({value: initialTextValue}, options, scope.$eval(iAttrs.uiCodemirror), scope.$eval(iAttrs.uiCodemirrorOpts));
                    if (iElement[0].tagName === 'TEXTAREA') {
                        // Might bug but still ...
                        codeMirror = window.CodeMirror.fromTextArea(iElement[0], opts);
                    } else {
                        iElement.html('');
                        codeMirror = new window.CodeMirror(function (cm_el) {
                            iElement.append(cm_el);
                        }, opts);
                    }
                    if (iAttrs.uiCodemirror || iAttrs.uiCodemirrorOpts) {
                        var codemirrorDefaultsKeys = Object.keys(window.CodeMirror.defaults);
                        scope.$watch(iAttrs.uiCodemirror || iAttrs.uiCodemirrorOpts, function updateOptions(newValues, oldValue) {
                            if (!angular.isObject(newValues)) {
                                return;
                            }
                            codemirrorDefaultsKeys.forEach(function (key) {
                                if (newValues.hasOwnProperty(key)) {
                                    if (oldValue && newValues[key] === oldValue[key]) {
                                        return;
                                    }
                                    codeMirror.setOption(key, newValues[key]);
                                }
                            });
                        }, true);
                    }
                    if (ngModel) {
                        // CodeMirror expects a string, so make sure it gets one.
                        // This does not change the model.
                        ngModel.$formatters.push(function (value) {
                            if (angular.isUndefined(value) || value === null) {
                                return '';
                            } else if (angular.isObject(value) || angular.isArray(value)) {
                                return JSON.stringify(value);
                            }
                            return value;
                        });
                        // Override the ngModelController $render method, which is what gets called when the model is updated.
                        // This takes care of the synchronizing the codeMirror element with the underlying model, in the case that it is changed by something else.
                        ngModel.$render = function () {
                            //Code mirror expects a string so make sure it gets one
                            //Although the formatter have already done this, it can be possible that another formatter returns undefined (for example the required directive)
                            var safeViewValue = ngModel.$viewValue || '';
                            codeMirror.setValue(safeViewValue);
                        };
                        // Keep the ngModel in sync with changes from CodeMirror
                        codeMirror.on('change', function (instance) {
                            var newValue = instance.getValue();
                            if (newValue !== ngModel.$viewValue) {
                                // Changes to the model from a callback need to be wrapped in $apply or angular will not notice them
                                scope.$apply(function () {
                                    try {
                                        var parsed = JSON.parse(newValue);
                                        ngModel.$setViewValue(parsed);
                                    } catch (e){
                                        //Safe to ignore this :)
                                    }
                                });
                            }

                            //var totalLines = codeMirror.lineCount();
                            //codeMirror.autoFormatRange({line:0, ch:0}, {line:totalLines});
                        });
                    }
                    // Watch ui-refresh and refresh the directive
                    if (iAttrs.uiRefresh) {
                        scope.$watch(iAttrs.uiRefresh, function (newVal, oldVal) {
                            // Skip the initial watch firing
                            if (newVal !== oldVal) {
                                codeMirror.refresh();
                            }
                        });
                    }
                    // Allow access to the CodeMirror instance through a broadcasted event
                    // eg: $broadcast('CodeMirror', function(cm){...});
                    scope.$on('CodeMirror', function (event, callback) {
                        if (angular.isFunction(callback)) {
                            callback(codeMirror);
                        } else {
                            throw new Error('the CodeMirror event requires a callback function');
                        }
                    });
                    // onLoad callback
                    if (angular.isFunction(opts.onLoad)) {
                        opts.onLoad(codeMirror);
                    }
                };
            }
        };
    }
]);
angular.module('schemaForm').config(
    ['schemaFormProvider', 'schemaFormDecoratorsProvider', 'sfPathProvider',
        function (schemaFormProvider, schemaFormDecoratorsProvider, sfPathProvider) {
            var mixed = function (name, schema, options) {
                if (schema.type == 'object' && !schema.ref && !schema.format && schema.mixed) {
                    var f = schemaFormProvider.stdFormObj(name, schema, options);
                    f.key = options.path;
                    f.type = 'mixed';
                    options.lookup[sfPathProvider.stringify(options.path)] = f;
                    return f;
                }
            };

            schemaFormProvider.defaults.object.unshift(mixed);

            //Add to the bootstrap directive
            schemaFormDecoratorsProvider.addMapping(
                'bootstrapDecorator',
                'mixed',
                'directives/decorators/bootstrap/mixed/mixed.html'
            );
            schemaFormDecoratorsProvider.createDirective(
                'mixed',
                'directives/decorators/bootstrap/mixed/mixed.html'
            );
        }
    ]);
