(function () {
    'use strict';

    angular.module('injectorApp')
        .controller('FormController', function ($rootScope, $scope, $http, $location, $routeParams, $anchorScroll, $timeout, $modal, models, configs, dependsOn, common, $window, flash, $translate) {
            var modelName = $routeParams.schema;
            var id = $routeParams.id;
            var modified = false;

            $scope.buttonsPosition = configs.backoffice.buttonsPosition || 'bottom';

            function walkThroughSchema(schema) {
                var keys = Object.keys(schema);
                for (var i in keys) {
                    if(schema[keys[i]]){
                        if (schema[keys[i]].i18nTitle) {
                            schema[keys[i]].title = $translate.instant(schema[keys[i]].i18nTitle);
                        } else if (angular.isObject(schema[keys[i]])) {
                            walkThroughSchema(schema[keys[i]]);
                        }
                    }
                }
            }

            walkThroughSchema($scope.m.schema);

            $scope.schema = {
                "type": "object",
                "title": modelName,
                "action": $scope.action,
                "properties": $scope.m.schema
            };

            $scope.form = common.processForm($scope.m.config.form);

            if ($scope.action.toLowerCase() == "create" && models.getShard(modelName) && models.getShard(modelName).value) {
                $scope.model[models.getShard(modelName).key] = models.getShard(modelName).value;
            }

            $rootScope.$on('shardChangeEvent', function () {
                if ($scope.action.toLowerCase() == "create" && models.getShard(modelName) && models.getShard(modelName).value) {
                    $scope.model[models.getShard(modelName).key] = models.getShard(modelName).value;
                }
            });


            dependsOn.apply($scope, modelName, $scope.model);

            $timeout(function () {
                $scope.$watch('model', function (newVal, oldVal) {
                    if (!angular.equals(newVal, oldVal)) {
                        modified = true;
                    }
                }, true);
            }, 0);

            $scope.schemaHREF = function () {
                console.log("/model/" + modelName);
                $location.path("/model/" + modelName);
                $location.hash('');
            };

            $scope.submitForm = function (form, model, isApply) {
                $scope.$broadcast('schemaFormValidate');
                if (form.$valid) {
                    if ($scope.action.toLowerCase() == 'update' && $scope.m.config.put) {
                        models.putDocument(modelName, id, model, function (response) {
                            if (response.status == '200') {
                                modified = false;
                                flash.success("Done", "Document saved successfully");
                                $scope.$broadcast('postedDocument', response.data);
                                $scope.$broadcast('puttedDocument', response.data);
                                if (!isApply) {
                                    $location.path('/model/' + modelName);
                                    $location.hash('');
                                }
                            }
                        });
                    } else if ($scope.action.toLowerCase() == 'create' && $scope.m.config.post) {
                        models.postDocument(modelName, model, function (response) {
                            if (response.status == '201') {
                                modified = false;
                                flash.success("Done", "Document saved successfully");
                                $scope.$broadcast('postedDocument', response.data);
                                if (!isApply) {
                                    $location.path('/model/' + modelName);
                                    $location.hash('');
                                } else {
                                    $location.path('/model/' + modelName + '/update/' + response.data[Object.keys(response.data)[0]]);
                                    $location.hash('');
                                }
                            }
                        });
                    }

                } else {
                    $scope.validation = !form.$valid;
                    $scope.validationErrors = form.$error;
                    $location.hash('error');
                    $anchorScroll.yOffset = 100;
                    $anchorScroll();

                }
            };

            $scope.cancel = function () {
                $window.history.back();
            };

            $scope.$on('$locationChangeStart', function (event, next, current) {
                if ($scope.ngForm.$valid && modified) {
                    event.preventDefault();

                    var modalInstance = $modal.open({
                        templateUrl: 'changedDocument.html',
                        controller: 'ModalChangedCtrl',
                        size: 'sm',
                        resolve: {
                            items: function () {
                                return $scope.items;
                            }
                        }
                    });

                    modalInstance.result.then(function () { //CLOSE CALLBACK
                        $scope.submitForm($scope.ngForm, $scope.model);
                    }, function () { //DISMISS CALLBACK
                        modified = false;
                        var basePathLength = $location.absUrl().length - $location.url().length;
                        $location.path(next.substring(basePathLength));
                    });

                }
            });


            $scope.$on('bkButton', function (event, form) {
                if (form.action == 'api') {
                    var http;
                    var url = form.url;

                    var getUrl = function (path) {
                        return path.replace(/[^/]*:([^/]*)+/g, function (s, m) {
                            return safeAccess($scope.model, m);
                        });
                    };

                    url = getUrl(url);

                    switch (form.method.toUpperCase()) {
                        case 'GET':
                            http = $http.get(url);
                            break;
                        case 'PUT':
                            http = $http.put(url, $scope.model);
                            break;
                        case 'POST':
                            var body = {};
                            if (form.body) {
                                angular.extend(body, form.body);
                            } else {
                                body = $scope.model;
                            }
                            http = $http.post(url, body);
                            break;
                        case 'DELETE':
                            http = $http.delete(url);
                            break;
                        default :
                            throw new Error('Method not configured properly');
                    }
                    if (http) {
                        http.success(function (res) {
                            angular.forEach(Object.keys(res), function (key) {
                                $scope.model[key] = res[key];
                            });
                        }).error(function (err) {
                            console.error(err);
                        });
                    }
                } else if (form.action == 'function') {
                    window[form.func]($scope.model, $scope.m.schema);
                }
            });

            $rootScope.$on('$translateChangeSuccess', function () {
                walkThroughSchema($scope.schema.properties);
                $scope.$broadcast('schemaFormRedraw');
            });
        })
        // It is not the same as the $modal service used above.
        .controller('ModalChangedCtrl', function ($scope, $modalInstance, items) {

            $scope.ok = function () {
                $modalInstance.close('ok');
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        });
}());