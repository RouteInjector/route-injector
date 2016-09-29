angular.module("schemaForm").run(["$templateCache", function($templateCache) {$templateCache.put("directives/decorators/bootstrap/imageinjector/imageinjector.html","<link rel=\"stylesheet\" href=\"//cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/css/jasny-bootstrap.min.css\">\r\n<div class=\"form-group\" ng-class=\"{\'has-error\': hasError()}\">\r\n    <label class=\"control-label\" ng-show=\"showTitle()\">{{form.title}}</label>\r\n\r\n    <div class=\"input-group\">\r\n        <div class=\"fileinput fileinput-new\" data-provides=\"fileinput\">\r\n            <div class=\"fileinput-new thumbnail\" style=\"width: 200px; height: 150px;\">\r\n                <img bk-image-view ng-src=\"{{image}}\" filename=\"$$value$$\">\r\n            </div>\r\n            {{$$value$$}}\r\n            <div class=\"fileinput-preview fileinput-exists thumbnail\"\r\n                 style=\"max-width: 200px; max-height: 150px;\"></div>\r\n            <div>\r\n                <span class=\"btn btn-default btn-file\">\r\n                    <span class=\"fileinput-new\"><span class=\"glyphicon glyphicon-cloud-upload\"></span></span> <!-- upload image -->\r\n                    <span class=\"fileinput-exists\"><span class=\"glyphicon glyphicon-pencil\"></span></span> <!-- change image -->\r\n                    <input bk-image-uploader\r\n                           type=\"file\"\r\n                           name=\"image\"\r\n                           path=\"form.path\"\r\n                           index=\"{{arrayIndex}}\"\r\n                           ngf-select=\"true\" ng-model=\"myFiles\" ngf-change=\"imageExists=false; onFileSelect($files)\">\r\n                </span>\r\n                <a href=\" #\" class=\"btn btn-default fileinput-exists\" data-dismiss=\"fileinput\"><span class=\"glyphicon glyphicon-remove\"></span></a> <!-- discard -->\r\n                <a ng-if=\"imageExists\" download=\"$$value$$\" ng-href=\"{{image}}\" target=\"_self\" class=\"btn btn-default\"><span class=\"glyphicon glyphicon-cloud-download\"></span></a> <!-- download -->\r\n                <a ng-if=\"imageExists\" ng-click=\"deleteFile(arrayIndex)\" class=\"btn btn-default\"><span class=\"glyphicon glyphicon-trash\"></span></a> <!-- delete from server -->\r\n            </div>\r\n        </div>\r\n    </div>\r\n    <span class=\"help-block\">{{ (hasError() && errorMessage(schemaError())) || form.description}}</span>\r\n</div>\r\n<script src=\"//cdnjs.cloudflare.com/ajax/libs/jasny-bootstrap/3.1.3/js/jasny-bootstrap.min.js\"></script>");}]);
angular.module('schemaForm')
    .directive('bkImageUploader', ['$http', '$routeParams', '$timeout', 'models', function ($http, $routeParams, $timeout, models) {
        return {
            restrict: 'A',
            scope: true,
            link: function (scope, element, attrs, ngModel) {
                var modelName = $routeParams.schema;
                scope.onFileSelect = function ($files) {
                    console.log("ola ke ase");
                    if($files && $files.length>0) {
                        console.log("MIIIIGO");
                        scope.$on('postedDocument', function (event, args) {
                                if (scope.myFiles && scope.myFiles.length > 0) {
                                    var file = scope.myFiles[0];
                                    models.getModelConfig(modelName, function (config) {
                                        var fieldName = scope.$eval(attrs.path);
                                        //console.log(modelName, args[config.id], fieldName, scope.$eval(attrs.index), file);
                                        models.uploadImage(modelName, args[config.id], fieldName, scope.$eval(attrs.index), file, function (data) {
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
    .directive('bkImageView', function ($routeParams, models) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs, ngModel) {
                var defaultImage = '//dummyimage.com/200x150/cccccc/ffffff&text=Upload+Image';
                var id = $routeParams.id;
                var modelName = $routeParams.schema;
                scope.$watch(attrs.filename, function (value) {
                    if (value) {
                        models.getImageUrl(modelName, id, value, function (url) {
                            scope.image = url;
                            scope.imageExists = true;
                        });
                    } else {
                        scope.image = defaultImage;
                        scope.imageExists = false;
                    }
                });

                scope.downloadImage = function () {
                    console.log("TODO: Download image from model", modelName, "and id", id);
                };

                scope.deleteImage = function (index) {
                    models.deleteImage(modelName, id, index, scope.$eval(attrs.filename), function () {
                        console.log("Image deleted");
                        scope.image = defaultImage;
                    });
                }
            }
        }
    });

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
