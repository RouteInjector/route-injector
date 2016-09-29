angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/fileinjector/fileinjector.html","<link rel=\"stylesheet\" href=\"//cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css\">\r\n<div class=\"form-group\" ng-class=\"{\'has-error\': hasError()}\">\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n\r\n    <div class=\"input-group\">\r\n        <div class=\"fileinput fileinput-new\" data-provides=\"fileinput\">\r\n            <div class=\"fileinput-new thumbnail\" style=\"width: 200px; height: 150px;\">\r\n                <img bk-file-view ng-src=\"{{file}}\" filename=\"$$value$$\">\r\n            </div>\r\n            {{$$value$$}}\r\n            <div class=\"fileinput-preview fileinput-exists thumbnail\"\r\n                 style=\"max-width: 200px; max-height: 150px;\"></div>\r\n            <div>\r\n                <span class=\"btn btn-default btn-file\">\r\n                    <span class=\"fileinput-new\"><span class=\"glyphicon glyphicon-cloud-upload\"></span></span> <!-- upload file -->\r\n                    <span class=\"fileinput-exists\"><span class=\"glyphicon glyphicon-pencil\"></span></span> <!-- change file -->\r\n                    <input bk-file-uploader\r\n                           type=\"file\"\r\n                           name=\"file\"\r\n                           path=\"form.path\"\r\n                           index=\"{{arrayIndex}}\"\r\n                           ngf-select=\"true\" ng-model=\"myFiles\" ngf-change=\"fileExists=false; onFileSelect($files)\">\r\n                </span>\r\n                <a href=\" #\" class=\"btn btn-default fileinput-exists\" data-dismiss=\"fileinput\"><span class=\"glyphicon glyphicon-remove\"></span></a> <!-- discard -->\r\n                <a ng-if=\"fileExists\" download=\"$$value$$\" ng-href=\"{{file}}\" target=\"_self\" class=\"btn btn-default\"><span class=\"glyphicon glyphicon-cloud-download\"></span></a> <!-- download -->\r\n                <a ng-if=\"fileExists\" ng-click=\"deleteFile(arrayIndex)\" class=\"btn btn-default\"><span class=\"glyphicon glyphicon-trash\"></span></a> <!-- delete from server -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>\r\n<script src=\"//cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js\"></script>");}]);
angular.module('schemaForm')
    .directive('bkFileUploader', ['$http', '$routeParams', '$timeout', 'models', function ($http, $routeParams, $timeout, models) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs, ngModel) {
                var modelName = $routeParams.schema;
                scope.onFileSelect = function ($files) {
                    if ($files && $files.length > 0) {
                        scope.$on('postedDocument', function (event, args) {
                            if (scope.myFiles && scope.myFiles.length > 0) {
                                var file = scope.myFiles[0];
                                models.getModelConfig(modelName, function (config) {
                                    var fieldName = scope.$eval(attrs.path);
                                    //console.log(modelName, args[config.id], fieldName, scope.$eval(attrs.index), file);
                                    models.uploadFile(modelName, args[config.id], fieldName, scope.arrayIndex, file, function (data) {
                                        //console.log(data);
                                    });
                                });
                            }
                        });
                    }
                };
            }
        }
    }])
    .directive('bkFileView', function ($routeParams, models) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs, ngModel) {
                var defaultImageForFile = '//dummyimage.com/200x150/cccccc/ffffff&text=Upload+File';
                var id = $routeParams.id;
                var modelName = $routeParams.schema;
                scope.$watch(attrs.filename, function (value) {
                    if (value) {
                        models.getFileUrl(modelName, id, value, function (url) {
                            scope.file = url;
                            scope.fileExists = true;
                        });
                    } else {
                        scope.file = defaultImageForFile;
                        scope.fileExists = false;
                    }
                });

                scope.downloadImage = function () {
                    console.log("TODO: Download file from model", modelName, "and id", id);
                };

                scope.deleteFile = function (index) {
                    models.deleteFile(modelName, id, index, scope.$eval(attrs.filename), function () {
                        console.log("File deleted");
                        scope.file = defaultImageForFile;
                    });
                }
            }
        }
    });

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
