(function () {
    'use strict';
    angular.module('injectorApp')

        .controller('ModelController', function ($scope, $http, $route, $routeParams, $modal, $location, common, models, flash, configs, search) {
            var defaultItemsPerPage = 20;
            $scope.flash = flash;
            $scope.common = common;
            $scope.removeDisabled = 'disabled';

            $scope.maxSize = 10;
            $scope.schema = $routeParams.schema;
            $scope.create = false;
            $scope.checkedGroupIds = {};
            search.clearQuery();

            $scope.$watch("removeAll", function (value) {
                if (value !== undefined) {
                    for (var i in $scope.elements) {
                        $scope.elements[i].checked = value;
                    }
                }
            });

            models.getModel($scope.schema, function (model) {
                $scope.config = model.config;
                $scope.schemaForm = model.schema;

                if (model.config.isSingle) { //In single documents, this page / controller should not appear anymore !
                    $location.path('/');   //Redirect to home
                    return;
                }

                //Build the array with all the displayable elements
                $scope.config.allDisplayFields = [];
                $scope.config.allDisplayFields.push($scope.config.displayField);
                if ($scope.config.extraDisplayFields) {
                    $scope.config.allDisplayFields = $scope.config.allDisplayFields.concat($scope.config.extraDisplayFields);
                }

                $scope.search = function (skip) {
                    if (skip !== undefined) {
                        search.setSkip(skip);
                    }

                    search.search($scope.schema, function (elements, count, err) {
                        if (elements) {
                            $scope.elements = elements;
                        }
                        $scope.totalElements = count;
                    });
                };

                $scope.itemsPerPage = $scope.userItemsPerPage = configs.backoffice.itemsPerPage || defaultItemsPerPage;
                search.setLimit($scope.itemsPerPage);
                search.setSkip(0);

                //Init elements
                $scope.search();

                // Init function of pageChanged
                $scope.pageChanged = function () {
                    $scope.itemsPerPage = $scope.userItemsPerPage;
                    if ($scope.currentPage > 0 && $scope.itemsPerPage > 0) {
                        var skip = (($scope.currentPage - 1) * $scope.itemsPerPage);
                        search.setSkip(skip);
                    } else {
                        search.setSkip(0);
                    }
                    search.setLimit($scope.itemsPerPage);
                    $scope.search();
                };

                $scope.id = function (element) {
                    return element[$scope.config.id];
                };

                $scope.shard = function (element) {
                    return element[$scope.config.shard.shardKey];
                };

                $scope.hasShard = function (element) {
                    var hasShard = $scope.config.shard && $scope.config.shard.shardKey;
                    return hasShard && element[$scope.config.shard.shardKey];
                };

                $scope.getUrl = function (element, schema) {
                    var model;
                    if(element.__t) {
                        model = element.__t;
                    } else {
                        model = schema;
                    }
                    var url = "#/model/" + model + "/update/" + encodeURIComponent($scope.id(element));
                    if ($scope.hasShard(element)) {
                        url += "/" + encodeURIComponent($scope.shard(element));
                    }
                    return url;
                };

                $scope.isDisabled = function (element) {
                    return !(element[$scope.config.id] && element[$scope.config.id] !== "");
                };

                $scope.displayCustomField = function (field, element) {
                    var s = common.getField(field, element);
                    return (s === undefined || s === "") ? "<empty>" : s;
                };

                $scope.sortBy = function (property, asc) {
                    search.addSortBy(property, asc);
                    $scope.search(0);
                };

                $scope.getSort = function (property) {
                    return search.getSort(property);
                };

                $scope.$on('shardChangeEvent', function (event, data) {
                    $scope.search(0);
                });
            });

            $scope.promptAlert = function (cb) {
                var del;
                if (del) {
                    cb(del);
                }
                var modalInstance = $modal.open({
                    templateUrl: 'myModalContent.html',
                    controller: 'ModalInstanceCtrl',
                    size: 'sm',
                    resolve: {
                        items: function () {
                            return $scope.items;
                        }
                    }
                });

                modalInstance.result.then(function () {
                    del = true;
                    cb(true);
                });
            };
        })

        .filter('to_trusted', ['$sce', function ($sce) {
            return function (text) {
                if (text) {
                    return $sce.trustAsHtml(text.toString());
                } else {
                    return text;
                }
            };
        }])

        // Please note that $modalInstance represents a modal window (instance) dependency.
        // It is not the same as the $modal service used above.
        .controller('ModalInstanceCtrl', function ($scope, $modalInstance, items) {

            $scope.ok = function () {
                $modalInstance.close('ok');
            };

            $scope.cancel = function () {
                $modalInstance.dismiss('cancel');
            };
        })

        .controller('ImportModalInstanceCtrl', function ($scope, $modalInstance, items) {
        });
}());
