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
