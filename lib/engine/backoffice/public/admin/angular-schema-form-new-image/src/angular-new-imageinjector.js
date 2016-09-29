angular.module('schemaForm')
    .directive('bkNewImageUploader', ['$http', '$routeParams', '$timeout', 'models', function ($http, $routeParams, $timeout, models) {
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
                                    models.uploadImage(modelName, args[config.id], fieldName, scope.arrayIndex, file, function (data) {
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
    .directive('bkNewImageView', function ($routeParams, models) {
        return {
            restrict: 'A',
            require: 'ngModel',
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

                scope.deleteImage = function (index, model) {
                    models.deleteImage(modelName, id, index, scope.$eval(attrs.filename), function () {
                        console.log("Image deleted");
                        ngModel.$setViewValue(null);
                    });
                }
            }
        }
    });
